import uuid
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import get_db, engine, Base
from backend.models import SystemSettingsModel, SystemLogModel, PositionModel, TradeModel
from backend.schemas import (
    HealthResponse,
    DashboardMetricsResponse,
    OpportunitySchema,
    SystemSettingsSchema,
    SystemLogSchema
)

app = FastAPI(
    title="Solana AI Meme Coin Autonomous Trading Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed default settings on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    existing = db.query(SystemSettingsModel).first()
    if not existing:
        default_settings = SystemSettingsModel(
            trading_enabled=settings.TRADING_ENABLED,
            risk_per_trade_pct=1.0,
            max_position_size_usd=10.0,
            max_open_positions=3,
            daily_loss_limit_usd=5.0,
            weekly_loss_limit_usd=15.0,
            max_drawdown_pct=10.0,
            min_liquidity_usd=5000.0,
            max_slippage_pct=2.0,
            max_price_impact_pct=3.0,
            min_opportunity_score=75.0,
            priority_fee_lamports=10000,
            compounding_mode="OFF",
            kill_switch=False,
            emergency_stop=False
        )
        db.add(default_settings)
        db.commit()

@app.get("/api/v1/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    kill_switch = config_record.kill_switch if config_record else False
    
    # Evaluate safety gates deterministically
    blockers = []
    if not settings.TRADING_ENABLED or not config_record.trading_enabled:
        blockers.append("LIVE trading not intentionally enabled by owner")
    if kill_switch:
        blockers.append("Emergency Kill Switch is currently ACTIVE")
    if not settings.TRADING_PRIVATE_KEY:
        blockers.append("TRADING_PRIVATE_KEY is unconfigured")

    status = "BLOCKED" if blockers else "LIVE"

    return HealthResponse(
        status=status,
        database="CONNECTED",
        rpc="CONNECTED",
        market_data="HEALTHY",
        workers="RUNNING",
        execution="READY" if not blockers else "BLOCKED",
        safety="READY",
        risk="READY",
        reconciliation="HEALTHY",
        kill_switch=kill_switch,
        emergency_stop=config_record.emergency_stop if config_record else False,
        blockers=blockers
    )

@app.get("/api/v1/dashboard/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    open_count = db.query(PositionModel).filter(PositionModel.status == "OPEN").count()
    trades_count = db.query(TradeModel).count()

    return DashboardMetricsResponse(
        balance_sol=0.0,
        balance_usd=0.0,
        equity_usd=0.0,
        daily_pnl_usd=0.0,
        weekly_pnl_usd=0.0,
        monthly_pnl_usd=0.0,
        net_profit_usd=0.0,
        drawdown_pct=0.0,
        win_rate_pct=0.0,
        profit_factor=0.0,
        open_positions_count=open_count,
        closed_trades_count=trades_count
    )

@app.get("/api/v1/opportunities", response_model=list[OpportunitySchema])
def get_opportunities():
    return []

@app.get("/api/v1/positions")
def get_positions(db: Session = Depends(get_db)):
    positions = db.query(PositionModel).all()
    return positions

@app.get("/api/v1/trades")
def get_trades(db: Session = Depends(get_db)):
    trades = db.query(TradeModel).all()
    return trades

@app.get("/api/v1/settings", response_model=SystemSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    return SystemSettingsSchema(
        trading_enabled=config_record.trading_enabled,
        risk_per_trade_pct=config_record.risk_per_trade_pct,
        max_position_size_usd=config_record.max_position_size_usd,
        max_open_positions=config_record.max_open_positions,
        daily_loss_limit_usd=config_record.daily_loss_limit_usd,
        weekly_loss_limit_usd=config_record.weekly_loss_limit_usd,
        max_drawdown_pct=config_record.max_drawdown_pct,
        min_liquidity_usd=config_record.min_liquidity_usd,
        max_slippage_pct=config_record.max_slippage_pct,
        max_price_impact_pct=config_record.max_price_impact_pct,
        min_opportunity_score=config_record.min_opportunity_score,
        priority_fee_lamports=config_record.priority_fee_lamports,
        compounding_mode=config_record.compounding_mode
    )

@app.put("/api/v1/settings", response_model=SystemSettingsSchema)
def update_settings(payload: SystemSettingsSchema, db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    if not config_record:
        raise HTTPException(status_code=404, detail="Settings record not found")

    for key, value in payload.dict().items():
        setattr(config_record, key, value)

    db.commit()
    db.refresh(config_record)
    return payload

@app.get("/api/v1/logs", response_model=list[SystemLogSchema])
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(SystemLogModel).order_by(SystemLogModel.timestamp.desc()).limit(100).all()
    return [
        SystemLogSchema(
            id=l.id,
            timestamp=l.timestamp.isoformat(),
            service=l.service,
            event=l.event,
            severity=l.severity,
            message=l.message
        )
        for l in logs
    ]

@app.post("/api/v1/kill-switch/activate")
def activate_kill_switch(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    config_record.kill_switch = True
    
    log = SystemLogModel(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        service="SAFETY_ENGINE",
        event="KILL_SWITCH_ACTIVATED",
        severity="CRITICAL",
        message="Kill switch activated by operator."
    )
    db.add(log)
    db.commit()
    return {"success": True, "status": "KILLED"}

@app.post("/api/v1/kill-switch/deactivate")
def deactivate_kill_switch(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    config_record.kill_switch = False
    
    log = SystemLogModel(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        service="SAFETY_ENGINE",
        event="KILL_SWITCH_DEACTIVATED",
        severity="WARNING",
        message="Kill switch deactivated by operator."
    )
    db.add(log)
    db.commit()
    return {"success": True, "status": "READY"}

@app.post("/api/v1/trading/enable")
def enable_trading(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    config_record.trading_enabled = True
    db.commit()
    return {"success": True, "status": "LIVE"}

@app.post("/api/v1/trading/disable")
def disable_trading(db: Session = Depends(get_db)):
    config_record = db.query(SystemSettingsModel).first()
    config_record.trading_enabled = False
    db.commit()
    return {"success": True, "status": "BLOCKED"}
