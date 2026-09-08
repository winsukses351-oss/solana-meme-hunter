from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from security import get_current_user
from models.schema import RiskSettingsSchema

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=RiskSettingsSchema)
async def get_settings(db=Depends(get_db), current_user: str = Depends(get_current_user)):
    row = await db.fetchrow("SELECT * FROM system_settings WHERE id = 1")
    if not row:
        raise HTTPException(status_code=404, detail="Settings record not initialized")
    return dict(row)

@router.post("", response_model=RiskSettingsSchema)
async def update_settings(payload: RiskSettingsSchema, db=Depends(get_db), current_user: str = Depends(get_current_user)):
    query = """
        UPDATE system_settings SET
            trading_enabled = $1,
            kill_switch_active = $2,
            risk_per_trade_sol = $3,
            max_position_size_sol = $4,
            max_open_positions = $5,
            daily_loss_limit_sol = $6,
            weekly_loss_limit_sol = $7,
            max_drawdown_percent = $8,
            min_liquidity_usd = $9,
            max_slippage_percent = $10,
            max_price_impact_percent = $11,
            min_opportunity_score = $12,
            take_profit_percent = $13,
            stop_loss_percent = $14,
            trailing_stop_percent = $15,
            compounding_option = $16,
            updated_at = NOW()
        WHERE id = 1
        RETURNING *;
    """
    row = await db.fetchrow(
        query,
        payload.trading_enabled, payload.kill_switch_active, payload.risk_per_trade_sol,
        payload.max_position_size_sol, payload.max_open_positions, payload.daily_loss_limit_sol,
        payload.weekly_loss_limit_sol, payload.max_drawdown_percent, payload.min_liquidity_usd,
        payload.max_slippage_percent, payload.max_price_impact_percent, payload.min_opportunity_score,
        payload.take_profit_percent, payload.stop_loss_percent, payload.trailing_stop_percent,
        payload.compounding_option
    )
    
    # Audit log entry
    await db.execute(
        "INSERT INTO audit_logs (event_type, severity, message) VALUES ($1, $2, $3)",
        "SETTINGS_UPDATE", "INFO", f"System risk settings updated by user {current_user}"
    )
    
    return dict(row)

@router.post("/kill-switch")
async def trigger_kill_switch(active: bool, db=Depends(get_db), current_user: str = Depends(get_current_user)):
    await db.execute(
        "UPDATE system_settings SET kill_switch_active = $1, trading_enabled = FALSE, updated_at = NOW() WHERE id = 1",
        active
    )
    severity = "CRITICAL" if active else "INFO"
    message = f"KILL SWITCH {'ACTIVATED' if active else 'DEACTIVATED'} by {current_user}"
    await db.execute(
        "INSERT INTO audit_logs (event_type, severity, message) VALUES ($1, $2, $3)",
        "KILL_SWITCH_TOGGLE", severity, message
    )
    return {"status": "SUCCESS", "kill_switch_active": active, "trading_enabled": False}
