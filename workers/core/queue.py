import asyncio
import json
import logging
import random
import time
from typing import Any, Callable, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import nats
from nats.aio.client import Client as NATS

logger = logging.getLogger(__name__)


class MessageStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY = "retry"
    DEAD_LETTER = "dead_letter"


@dataclass
class QueueMessage:
    id: str
    data: Dict[str, Any]
    status: MessageStatus
    retry_count: int = 0
    max_retries: int = 3
    created_at: float = None
    processed_at: Optional[float] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = time.time()


class QueueManager:
    def __init__(self, nats_url: str, service_name: str, max_retries: int = 3):
        self.nats_url = nats_url
        self.service_name = service_name
        self.max_retries = max_retries
        self.nc: Optional[NATS] = None
        self.subscription = None
        self.processing_messages: Dict[str, QueueMessage] = {}
        self.dlq_messages: Dict[str, QueueMessage] = {}
        
        # Queue configuration
        self.retry_delays = [1, 5, 15, 60, 300]  # Exponential backoff with jitter
        self.jitter_factor = 0.1  # 10% jitter
        
    async def connect(self):
        """Connect to NATS"""
        try:
            self.nc = nats.NATS()
            await self.nc.connect(self.nats_url)
            logger.info(f"Connected to NATS at {self.nats_url}")
        except Exception as e:
            logger.error(f"Failed to connect to NATS: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from NATS"""
        if self.nc:
            await self.nc.close()
            logger.info("Disconnected from NATS")
    
    def _calculate_retry_delay(self, retry_count: int) -> float:
        """Calculate retry delay with exponential backoff and jitter"""
        if retry_count >= len(self.retry_delays):
            retry_count = len(self.retry_delays) - 1
        
        base_delay = self.retry_delays[retry_count]
        jitter = base_delay * self.jitter_factor * random.uniform(-1, 1)
        return max(0.1, base_delay + jitter)
    
    async def publish_message(self, subject: str, data: Dict[str, Any], 
                            reply_to: Optional[str] = None) -> str:
        """Publish a message to a queue"""
        message_id = f"{self.service_name}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        
        message_data = {
            "id": message_id,
            "data": data,
            "reply_to": reply_to,
            "created_at": time.time(),
            "service": self.service_name
        }
        
        await self.nc.publish(subject, json.dumps(message_data).encode())
        logger.info(f"Published message {message_id} to {subject}")
        
        return message_id
    
    async def subscribe_to_queue(self, subject: str, handler: Callable, 
                               queue_group: Optional[str] = None):
        """Subscribe to a queue with message handler"""
        async def message_handler(msg):
            try:
                data = json.loads(msg.data.decode())
                message = QueueMessage(
                    id=data["id"],
                    data=data["data"],
                    status=MessageStatus.PROCESSING,
                    created_at=data.get("created_at", time.time())
                )
                
                self.processing_messages[message.id] = message
                
                # Process the message
                result = await handler(message)
                
                # Mark as completed
                message.status = MessageStatus.COMPLETED
                message.processed_at = time.time()
                
                # Send reply if requested
                if data.get("reply_to"):
                    reply_data = {
                        "message_id": message.id,
                        "status": "completed",
                        "result": result
                    }
                    await self.nc.publish(data["reply_to"], json.dumps(reply_data).encode())
                
                logger.info(f"Message {message.id} processed successfully")
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await self._handle_message_error(message, e, msg)
        
        if queue_group:
            self.subscription = await self.nc.subscribe(subject, queue=queue_group, cb=message_handler)
        else:
            self.subscription = await self.nc.subscribe(subject, cb=message_handler)
        
        logger.info(f"Subscribed to {subject} with queue group: {queue_group}")
    
    async def _handle_message_error(self, message: QueueMessage, error: Exception, original_msg):
        """Handle message processing errors with retry logic"""
        message.retry_count += 1
        message.error_message = str(error)
        
        if message.retry_count <= message.max_retries:
            # Retry with exponential backoff and jitter
            delay = self._calculate_retry_delay(message.retry_count)
            message.status = MessageStatus.RETRY
            
            logger.warning(f"Retrying message {message.id} in {delay}s (attempt {message.retry_count})")
            
            # Schedule retry
            asyncio.create_task(self._retry_message(message, delay, original_msg))
        else:
            # Move to dead letter queue
            message.status = MessageStatus.DEAD_LETTER
            self.dlq_messages[message.id] = message
            
            logger.error(f"Message {message.id} moved to DLQ after {message.retry_count} retries")
            
            # Publish to DLQ
            dlq_data = {
                "original_message": message.__dict__,
                "error": str(error),
                "moved_to_dlq_at": time.time()
            }
            await self.nc.publish(f"{original_msg.subject}.dlq", json.dumps(dlq_data).encode())
    
    async def _retry_message(self, message: QueueMessage, delay: float, original_msg):
        """Retry a failed message after delay"""
        await asyncio.sleep(delay)
        
        # Re-publish the original message
        retry_data = {
            "id": message.id,
            "data": message.data,
            "retry_count": message.retry_count,
            "created_at": message.created_at,
            "service": self.service_name
        }
        
        await self.nc.publish(original_msg.subject, json.dumps(retry_data).encode())
        logger.info(f"Retried message {message.id}")
    
    async def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics"""
        return {
            "processing_messages": len(self.processing_messages),
            "dlq_messages": len(self.dlq_messages),
            "service": self.service_name,
            "connected": self.nc.is_connected if self.nc else False
        }
    
    async def republish_dlq_message(self, message_id: str, subject: str):
        """Republish a message from DLQ"""
        if message_id not in self.dlq_messages:
            raise ValueError(f"Message {message_id} not found in DLQ")
        
        message = self.dlq_messages[message_id]
        message.status = MessageStatus.PENDING
        message.retry_count = 0
        message.error_message = None
        
        # Remove from DLQ and add to processing
        del self.dlq_messages[message_id]
        self.processing_messages[message_id] = message
        
        # Republish
        await self.publish_message(subject, message.data)
        logger.info(f"Republished DLQ message {message_id}")


class AutoScaler:
    def __init__(self, queue_manager: QueueManager, min_workers: int = 1, max_workers: int = 10):
        self.queue_manager = queue_manager
        self.min_workers = min_workers
        self.max_workers = max_workers
        self.current_workers = min_workers
        self.scaling_cooldown = 60  # seconds
        self.last_scale_time = 0
        
    async def check_scaling_needs(self):
        """Check if scaling is needed based on queue metrics"""
        if time.time() - self.last_scale_time < self.scaling_cooldown:
            return
        
        stats = await self.queue_manager.get_queue_stats()
        processing_count = stats["processing_messages"]
        
        # Scale up if queue is backing up
        if processing_count > self.current_workers * 2 and self.current_workers < self.max_workers:
            await self.scale_up()
        # Scale down if queue is mostly empty
        elif processing_count < self.current_workers // 2 and self.current_workers > self.min_workers:
            await self.scale_down()
    
    async def scale_up(self):
        """Scale up the number of workers"""
        if self.current_workers < self.max_workers:
            self.current_workers += 1
            self.last_scale_time = time.time()
            logger.info(f"Scaled up to {self.current_workers} workers")
    
    async def scale_down(self):
        """Scale down the number of workers"""
        if self.current_workers > self.min_workers:
            self.current_workers -= 1
            self.last_scale_time = time.time()
            logger.info(f"Scaled down to {self.current_workers} workers")


class GPUCacheWarmer:
    def __init__(self, model_path: str, warmup_batch_size: int = 1):
        self.model_path = model_path
        self.warmup_batch_size = warmup_batch_size
        self.is_warmed = False
        
    async def warm_cache(self):
        """Warm up GPU cache with dummy inference"""
        if self.is_warmed:
            return
        
        try:
            logger.info("Warming up GPU cache...")
            
            # Simulate model loading and warmup inference
            # In real implementation, this would load the actual model
            await asyncio.sleep(2)  # Simulate model loading
            
            # Simulate warmup inference
            for i in range(3):
                await asyncio.sleep(0.5)  # Simulate inference time
                logger.info(f"Warmup inference {i+1}/3 completed")
            
            self.is_warmed = True
            logger.info("GPU cache warmed up successfully")
            
        except Exception as e:
            logger.error(f"Failed to warm GPU cache: {e}")
            raise
    
    async def check_cache_status(self) -> bool:
        """Check if cache is warmed"""
        return self.is_warmed
