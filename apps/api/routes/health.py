from fastapi import APIRouter, Depends
from database import get_db
from models.schema import HealthStatusResponse
from config import settings
import httpx

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("", response_model=HealthStatusResponse)
async def check_system_health(db=Depends(get_db)):
    blockers = []
    
    # 1. Database Check
    db_healthy = False
    try:
        val = await db.fetchval("SELECT 1")
        if val == 1:
            db_healthy = True
    except Exception as e:
        blockers.append(f"Database connection error: {str(e)}")

    # 2. RPC Check
    rpc_healthy = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(settings.SOLANA_RPC_URL, json={"jsonrpc": "2.0", "id": 1, "method": "getHealth"})
            if res.status_code == 200 and "result" in res.json() and res.json()["result"] == "ok":
                rpc_healthy = True
            else:
                blockers.append("Solana RPC unhealthy or degraded")
    except Exception as e:
        blockers.append(f"Solana RPC unreachable: {str(e)}")

    # 3. Settings / Config Gates
    sys_settings = await db.fetchrow("SELECT * FROM system_settings WHERE id = 1")
    if sys_settings and sys_settings["kill_switch_active"]:
        blockers.append("EMERGENCY KILL SWITCH IS ACTIVE")

    if not settings.TRADING_PRIVATE_KEY:
        blockers.append("Trading private key is missing")

    trading_enabled = sys_settings["trading_enabled"] if sys_settings else False
    
    if len(blockers) > 0:
        overall_status = "BLOCKED"
    elif trading_enabled:
        overall_status = "LIVE"
    else:
        overall_status = "READY"

    return HealthStatusResponse(
        overall_status=overall_status,
        database=db_healthy,
        rpc=rpc_healthy,
        providers=True,
        worker=True,
        trading_enabled=trading_enabled,
        blockers=blockers
    )
