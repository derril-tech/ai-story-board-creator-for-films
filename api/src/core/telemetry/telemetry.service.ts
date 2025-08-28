import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import * as Profiling from '@sentry/profiling-node';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import {
  trace,
  metrics,
  context,
  SpanStatusCode,
  SpanKind,
  Tracer,
  Meter,
  Counter as OTelCounter,
  Histogram as OTelHistogram,
} from '@opentelemetry/api';
import {
  NodeSDK,
  trace as traceSDK,
  metrics as metricsSDK,
  resources,
} from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

@Injectable()
export class TelemetryService implements OnModuleInit, OnModuleDestroy {
  private sdk: NodeSDK;
  private tracer: Tracer;
  private meter: Meter;
  private prometheusExporter: PrometheusExporter;

  // Prometheus metrics
  private requestCounter: Counter;
  private requestDuration: Histogram;
  private errorCounter: Counter;
  private activeConnections: Gauge;

  // OpenTelemetry metrics
  private oTelRequestCounter: OTelCounter;
  private oTelRequestDuration: OTelHistogram;
  private oTelErrorCounter: OTelCounter;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeSentry();
    await this.initializeOpenTelemetry();
    await this.initializePrometheus();
  }

  async onModuleDestroy() {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  private async initializeSentry() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const environment = this.configService.get<string>('NODE_ENV', 'development');

    if (dsn) {
      Sentry.init({
        dsn,
        environment,
        integrations: [
          new Profiling.ProfilingIntegration(),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      });
    }
  }

  private async initializeOpenTelemetry() {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const serviceName = this.configService.get<string>('SERVICE_NAME', 'storyboard-api');
    const jaegerEndpoint = this.configService.get<string>('JAEGER_ENDPOINT');

    // Create resource
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    });

    // Create exporters
    const exporters = [];
    
    if (jaegerEndpoint) {
      const jaegerExporter = new JaegerExporter({
        endpoint: jaegerEndpoint,
      });
      exporters.push(jaegerExporter);
    }

    // Create Prometheus exporter
    this.prometheusExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });
    exporters.push(this.prometheusExporter);

    // Initialize SDK
    this.sdk = new NodeSDK({
      resource,
      traceExporter: exporters[0], // Use first exporter for traces
      metricReader: this.prometheusExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    await this.sdk.start();

    // Get tracer and meter
    this.tracer = trace.getTracer(serviceName);
    this.meter = metrics.getMeter(serviceName);

    // Create OpenTelemetry metrics
    this.oTelRequestCounter = this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    });

    this.oTelRequestDuration = this.meter.createHistogram('http_request_duration_seconds', {
      description: 'HTTP request duration in seconds',
    });

    this.oTelErrorCounter = this.meter.createCounter('http_errors_total', {
      description: 'Total number of HTTP errors',
    });
  }

  private async initializePrometheus() {
    // Enable default metrics
    collectDefaultMetrics();

    // Create custom metrics
    this.requestCounter = new Counter({
      name: 'storyboard_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
    });

    this.requestDuration = new Histogram({
      name: 'storyboard_api_request_duration_seconds',
      help: 'API request duration in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.errorCounter = new Counter({
      name: 'storyboard_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
    });

    this.activeConnections = new Gauge({
      name: 'storyboard_api_active_connections',
      help: 'Number of active connections',
    });
  }

  // Span management methods
  createSpan(name: string, kind: SpanKind = SpanKind.INTERNAL) {
    return this.tracer.startSpan(name, { kind });
  }

  async executeWithSpan<T>(
    name: string,
    operation: () => Promise<T>,
    kind: SpanKind = SpanKind.INTERNAL,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const span = this.createSpan(name, kind);
    
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }

    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  // Metric recording methods
  recordRequest(method: string, endpoint: string, statusCode: number, duration: number) {
    this.requestCounter.inc({ method, endpoint, status_code: statusCode.toString() });
    this.requestDuration.observe({ method, endpoint }, duration);
    this.oTelRequestCounter.add(1, { method, endpoint, status_code: statusCode.toString() });
    this.oTelRequestDuration.record(duration, { method, endpoint });
  }

  recordError(method: string, endpoint: string, errorType: string) {
    this.errorCounter.inc({ method, endpoint, error_type: errorType });
    this.oTelErrorCounter.add(1, { method, endpoint, error_type: errorType });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  // Prometheus metrics endpoint
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Sentry error reporting
  captureException(error: Error, context?: any) {
    Sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any) {
    Sentry.captureMessage(message, { level, extra: context });
  }
}
