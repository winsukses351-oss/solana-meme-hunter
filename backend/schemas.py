from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    database: str
    rpc: str
    market_data: str
    workers: str
    execution: str
    safety: str
    risk: str
    reconciliation: str
    kill_switch: bool
    emergency_stop: bool
    blockers: List[str]

class DashboardMetricsResponse(BaseModel):
    balance_sol: float
    balance_usd: float
    equity_usd: float
    daily_pnl_usd: float
    weekly_pnl_usd: float
    monthly_pnl_usd: float
    net_profit_usd: float
    drawdown_pct: float
    win_rate_pct: float
    profit_factor: float
    open_positions_count: int
    closed_trades_count: int

class OpportunitySchema(BaseModel):
    token_mint: str
    symbol: str
    name: str
    price_usd: float
    liquidity_usd: float
    volume_24h_usd: float
    opportunity_score: float
    safety_score: float
    smart_money_score: float
    whale_score: float
    momentum_score: float
    tier: str
    created_at: str
    is_blocked: bool
    block_reason: Optional[str] = None

class SystemSettingsSchema(BaseModel):
    trading_enabled: bool
    risk_per_trade_pct: float
    max_position_size_usd: float
    max_open_positions: int
    daily_loss_limit_usd: float
    weekly_loss_limit_usd: float
    max_drawdown_pct: float
    min_liquidity_usd: float
    max_slippage_pct: float
    max_price_impact_pct: float
    min_opportunity_score: float
    priority_fee_lamports: int
    compounding_mode: str

class SystemLogSchema(BaseModel):
    id: str
    timestamp: str
    service: str
    event: str
    severity: str
    message: str
