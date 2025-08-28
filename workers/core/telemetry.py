import os
import time
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps
import asyncio

# OpenTelemetry imports
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.exporter.prometheus import PrometheusExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.semantic_conventions import SemanticResourceAttributes

# Prometheus imports
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Sentry imports
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

logger = logging.getLogger(__name__)


class TelemetryService:
    def __init__(self, service_name: str, environment: str = "development"):
        self.service_name = service_name
        self.environment = environment
        self.tracer = None
        self.meter = None
        
        # Prometheus metrics
        self.request_counter = Counter(
            f'{service_name}_requests_total',
            'Total number of requests',
            ['method', 'endpoint', 'status_code']
        )
        self.request_duration = Histogram(
            f'{service_name}_request_duration_seconds',
            'Request duration in seconds',
            ['method', 'endpoint'],
            buckets=[0.1, 0.5, 1, 2, 5, 10]
        )
        self.error_counter = Counter(
            f'{service_name}_errors_total',
            'Total number of errors',
            ['method', 'endpoint', 'error_type']
        )
        self.active_tasks = Gauge(
            f'{service_name}_active_tasks',
            'Number of active tasks'
        )
        
        self._initialize_telemetry()
    
    def _initialize_telemetry(self):
        """Initialize OpenTelemetry and Sentry"""
        # Initialize Sentry
        sentry_dsn = os.getenv('SENTRY_DSN')
        if sentry_dsn:
            sentry_sdk.init(
                dsn=sentry_dsn,
                environment=self.environment,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=1.0 if self.environment == 'development' else 0.1,
                profiles_sample_rate=1.0 if self.environment == 'development' else 0.1,
            )
        
        # Create resource
        resource = Resource.create({
            SemanticResourceAttributes.SERVICE_NAME: self.service_name,
            SemanticResourceAttributes.SERVICE_VERSION: "1.0.0",
            SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT: self.environment,
        })
        
        # Initialize trace provider
        trace_provider = TracerProvider(resource=resource)
        
        # Add Jaeger exporter if configured
        jaeger_endpoint = os.getenv('JAEGER_ENDPOINT')
        if jaeger_endpoint:
            jaeger_exporter = JaegerExporter(
                agent_host_name=jaeger_endpoint.split(':')[0],
                agent_port=int(jaeger_endpoint.split(':')[1]) if ':' in jaeger_endpoint else 6831,
            )
            trace_provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
        
        # Set global trace provider
        trace.set_tracer_provider(trace_provider)
        self.tracer = trace.get_tracer(self.service_name)
        
        # Initialize meter provider
        meter_provider = MeterProvider(resource=resource)
        metrics.set_meter_provider(meter_provider)
        self.meter = metrics.get_meter(self.service_name)
        
        # Create OpenTelemetry metrics
        self.otel_request_counter = self.meter.create_counter(
            'http_requests_total',
            description='Total number of HTTP requests'
        )
        self.otel_request_duration = self.meter.create_histogram(
            'http_request_duration_seconds',
            description='HTTP request duration in seconds'
        )
        self.otel_error_counter = self.meter.create_counter(
            'http_errors_total',
            description='Total number of HTTP errors'
        )
    
    def instrument_fastapi(self, app):
        """Instrument FastAPI application"""
        FastAPIInstrumentor.instrument_app(app)
        RequestsInstrumentor().instrument()
        SQLAlchemyInstrumentor().instrument()
        RedisInstrumentor().instrument()
    
    def create_span(self, name: str, kind: trace.SpanKind = trace.SpanKind.INTERNAL):
        """Create a new span"""
        return self.tracer.start_span(name, kind=kind)
    
    def execute_with_span(self, name: str, operation: Callable, 
                         kind: trace.SpanKind = trace.SpanKind.INTERNAL,
                         attributes: Optional[Dict[str, Any]] = None):
        """Execute operation with span tracking"""
        span = self.create_span(name, kind)
        
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        
        try:
            result = operation()
            span.set_status(trace.Status(trace.StatusCode.OK))
            return result
        except Exception as e:
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise
        finally:
            span.end()
    
    async def execute_with_span_async(self, name: str, operation: Callable, 
                                     kind: trace.SpanKind = trace.SpanKind.INTERNAL,
                                     attributes: Optional[Dict[str, Any]] = None):
        """Execute async operation with span tracking"""
        span = self.create_span(name, kind)
        
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)
        
        try:
            result = await operation()
            span.set_status(trace.Status(trace.StatusCode.OK))
            return result
        except Exception as e:
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise
        finally:
            span.end()
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record request metrics"""
        self.request_counter.labels(method=method, endpoint=endpoint, status_code=str(status_code)).inc()
        self.request_duration.labels(method=method, endpoint=endpoint).observe(duration)
        self.otel_request_counter.add(1, {"method": method, "endpoint": endpoint, "status_code": str(status_code)})
        self.otel_request_duration.record(duration, {"method": method, "endpoint": endpoint})
    
    def record_error(self, method: str, endpoint: str, error_type: str):
        """Record error metrics"""
        self.error_counter.labels(method=method, endpoint=endpoint, error_type=error_type).inc()
        self.otel_error_counter.add(1, {"method": method, "endpoint": endpoint, "error_type": error_type})
    
    def set_active_tasks(self, count: int):
        """Set active tasks count"""
        self.active_tasks.set(count)
    
    def get_metrics(self) -> str:
        """Get Prometheus metrics"""
        return generate_latest()
    
    def capture_exception(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        """Capture exception in Sentry"""
        if context:
            sentry_sdk.set_context("additional", context)
        sentry_sdk.capture_exception(error)
    
    def capture_message(self, message: str, level: str = "info", context: Optional[Dict[str, Any]] = None):
        """Capture message in Sentry"""
        if context:
            sentry_sdk.set_context("additional", context)
        sentry_sdk.capture_message(message, level=level)


def telemetry_span(name: str, kind: trace.SpanKind = trace.SpanKind.INTERNAL):
    """Decorator for adding telemetry spans to functions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get telemetry service from first argument if it's a method
            telemetry = None
            if args and hasattr(args[0], 'telemetry'):
                telemetry = args[0].telemetry
            
            if telemetry:
                return telemetry.execute_with_span(name, lambda: func(*args, **kwargs), kind)
            else:
                return func(*args, **kwargs)
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Get telemetry service from first argument if it's a method
            telemetry = None
            if args and hasattr(args[0], 'telemetry'):
                telemetry = args[0].telemetry
            
            if telemetry:
                return await telemetry.execute_with_span_async(name, lambda: func(*args, **kwargs), kind)
            else:
                return await func(*args, **kwargs)
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return wrapper
    
    return decorator
