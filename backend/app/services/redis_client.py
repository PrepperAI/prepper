import redis
import os

# Use REDIS_URL if available (Render-style), otherwise fallback to host/port
redis_url = os.getenv("REDIS_URL")

if redis_url:
    redis_client = redis.from_url(redis_url, decode_responses=True)
else:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True
    )
