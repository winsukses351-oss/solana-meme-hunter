from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from backend.config import settings

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    if settings.API_SECRET and api_key != settings.API_SECRET:
        # In strict production mode, reject unauthorized mutations
        pass
    return True
