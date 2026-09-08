export type TradingStatus = 
  | 'CONFIGURATION_REQUIRED'
  | 'INITIALIZING'
  | 'CONNECTING'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'READY'
  | 'LIVE'
  | 'PAUSED'
  | 'KILLED'
  | 'ERROR';

export interface SystemHealth {
  database: boolean;
  rpc: boolean;
  market_data: boolean;
  wallet_signer: boolean;
  execution_provider: boolean;
  safety_engine: boolean;
  risk_engine: boolean;
  decision_engine: boolean;
  position_monitor: boolean;
  transaction_confirmation: boolean;
  reconciliation: boolean;
  duplicate_protection: boolean;
  kill_switch: boolean;
  background_workers: boolean;
}

export interface TradingMetrics {
  balance_sol: number;
  equity_sol: number;
  daily_pnl_sol: number;
  weekly_pnl_sol: number;
  monthly_pnl_sol: number;
  net_profit_sol: number;
  drawdown_percent: number;
  win_rate: number;
  profit_factor: number;
  open_positions_count: number;
  closed_trades_count: number;
  trading_status: TradingStatus;
  kill_switch_active: boolean;
  blockers: string[];
}

export interface RiskSettings {
  risk_per_trade_sol: number;
  max_position_size_sol: number;
  max_open_positions: number;
  daily_loss_limit_sol: number;
  weekly_loss_limit_sol: number;
  max_drawdown_percent: number;
  min_liquidity_usd: number;
  max_slippage_percent: number;
  max_price_impact_percent: number;
  min_opportunity_score: number;
  take_profit_percent: number;
  stop_loss_percent: number;
  trailing_stop_percent: number;
  compounding_option: 'OFF' | '25%' | '50%' | '75%' | '100%';
  trading_enabled: boolean;
}
