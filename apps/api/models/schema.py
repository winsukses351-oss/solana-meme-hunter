from pydantic import BaseModel, Field
from typing import List, Optional

class TokenSchema(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str

class RiskSettingsSchema(BaseModel):
    trading_enabled: bool
    kill_switch_active: bool
    risk_per_trade_sol: float = Field(gt=0)
    max_position_size_sol: float = Field(gt=0)
    max_open_positions: int = Field(gt=0)
    daily_loss_limit_sol: float = Field(gt=0)
    weekly_loss_limit_sol: float = Field(gt=0)
    max_drawdown_percent: float = Field(gt=0, le=100)
    min_liquidity_usd: float = Field(gt=0)
    max_slippage_percent: float = Field(gt=0)
    max_price_impact_percent: float = Field(gt=0)
    min_opportunity_score: int = Field(ge=0, le=100)
    take_profit_percent: float = Field(gt=0)
    stop_loss_percent: float = Field(gt=0)
    trailing_stop_percent: float = Field(gt=0)
    compounding_option: str

class HealthStatusResponse(BaseModel):
    overall_status: str
    database: bool
    rpc: bool
    providers: bool
    worker: bool
    trading_enabled: bool
    blockers: List[str]
