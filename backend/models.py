import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.database import Base


class SystemSettingsModel(Base):
  __tablename__ = 'settings'

  id = Column(Integer, primary_key=True, index=True)
  trading_enabled = Column(Boolean, default=False)
  risk_per_trade_pct = Column(Float, default=1.0)
  max_position_size_usd = Column(Float, default=10.0)
  max_open_positions = Column(Integer, default=3)
  daily_loss_limit_usd = Column(Float, default=5.0)
  weekly_loss_limit_usd = Column(Float, default=15.0)
  max_drawdown_pct = Column(Float, default=10.0)
  min_liquidity_usd = Column(Float, default=5000.0)
  max_slippage_pct = Column(Float, default=2.0)
  max_price_impact_pct = Column(Float, default=3.0)
  min_opportunity_score = Column(Float, default=75.0)
  priority_fee_lamports = Column(Integer, default=10000)
  compounding_mode = Column(String, default='OFF')
  kill_switch = Column(Boolean, default=False)
  emergency_stop = Column(Boolean, default=False)


class SystemLogModel(Base):
  __tablename__ = 'system_logs'

  id = Column(String, primary_key=True)
  timestamp = Column(DateTime, default=datetime.datetime.utcnow)
  service = Column(String, index=True)
  event = Column(String)
  severity = Column(String, index=True)
  message = Column(Text)


class PositionModel(Base):
  __tablename__ = 'positions'

  id = Column(String, primary_key=True)
  token_mint = Column(String, index=True)
  symbol = Column(String)
  entry_price = Column(Float)
  current_price = Column(Float)
  quantity = Column(Float)
  unrealized_pnl_usd = Column(Float, default=0.0)
  unrealized_pnl_pct = Column(Float, default=0.0)
  stop_loss_price = Column(Float)
  take_profit_price = Column(Float)
  trailing_stop_active = Column(Boolean, default=False)
  status = Column(String, default='OPEN')
  opened_at = Column(DateTime, default=datetime.datetime.utcnow)


class TradeModel(Base):
  __tablename__ = 'trades'

  id = Column(String, primary_key=True)
  execution_id = Column(String, unique=True, index=True)
  token_mint = Column(String, index=True)
  symbol = Column(String)
  side = Column(String)
  price = Column(Float)
  quantity = Column(Float)
  fees_usd = Column(Float)
  slippage_pct = Column(Float)
  price_impact_pct = Column(Float)
  gross_pnl_usd = Column(Float, default=0.0)
  net_pnl_usd = Column(Float, default=0.0)
  tx_signature = Column(String, default='')
  status = Column(String, default='CONFIRMED')
  created_at = Column(DateTime, default=datetime.datetime.utcnow)
