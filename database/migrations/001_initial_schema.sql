-- Initial Schema setup for Solana Autonomous Meme Coin Trader

CREATE TYPE trading_status_enum AS ENUM (
    'CONFIGURATION_REQUIRED', 'INITIALIZING', 'CONNECTING', 
    'DEGRADED', 'BLOCKED', 'READY', 'LIVE', 'PAUSED', 'KILLED', 'ERROR'
);

CREATE TYPE decision_action_enum AS ENUM ('BUY', 'IGNORE');

CREATE TYPE position_status_enum AS ENUM ('OPEN', 'CLOSING', 'CLOSED', 'ORPHANED', 'FAILED');

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    trading_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    kill_switch_active BOOLEAN NOT NULL DEFAULT FALSE,
    risk_per_trade_sol NUMERIC(12, 6) NOT NULL DEFAULT 0.05,
    max_position_size_sol NUMERIC(12, 6) NOT NULL DEFAULT 0.1,
    max_open_positions INT NOT NULL DEFAULT 3,
    daily_loss_limit_sol NUMERIC(12, 6) NOT NULL DEFAULT 0.5,
    weekly_loss_limit_sol NUMERIC(12, 6) NOT NULL DEFAULT 1.5,
    max_drawdown_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    min_liquidity_usd NUMERIC(12, 2) NOT NULL DEFAULT 5000.0,
    max_slippage_percent NUMERIC(5, 2) NOT NULL DEFAULT 3.0,
    max_price_impact_percent NUMERIC(5, 2) NOT NULL DEFAULT 2.5,
    min_opportunity_score INT NOT NULL DEFAULT 80,
    take_profit_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.0,
    stop_loss_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    trailing_stop_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    compounding_option VARCHAR(10) NOT NULL DEFAULT 'OFF',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- TOKENS TABLE
CREATE TABLE IF NOT EXISTS tokens (
    mint_address VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    decimals INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DECISIONS TABLE
CREATE TABLE IF NOT EXISTS decisions (
    id SERIAL PRIMARY KEY,
    token_mint VARCHAR(64) REFERENCES tokens(mint_address),
    action decision_action_enum NOT NULL,
    smart_money_score INT NOT NULL,
    whale_score INT NOT NULL,
    momentum_score INT NOT NULL,
    safety_score INT NOT NULL,
    opportunity_score INT NOT NULL,
    calculated_position_size_sol NUMERIC(12, 6) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- POSITIONS TABLE
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    token_mint VARCHAR(64) REFERENCES tokens(mint_address),
    status position_status_enum NOT NULL DEFAULT 'OPEN',
    amount_tokens NUMERIC(30, 0) NOT NULL,
    entry_price_sol NUMERIC(18, 12) NOT NULL,
    cost_basis_sol NUMERIC(12, 6) NOT NULL,
    current_price_sol NUMERIC(18, 12) NOT NULL,
    highest_price_sol NUMERIC(18, 12) NOT NULL,
    take_profit_price_sol NUMERIC(18, 12) NOT NULL,
    stop_loss_price_sol NUMERIC(18, 12) NOT NULL,
    realized_pnl_sol NUMERIC(12, 6) DEFAULT 0.0,
    unrealized_pnl_sol NUMERIC(12, 6) DEFAULT 0.0,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- TRADES TABLE
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    position_id INT REFERENCES positions(id),
    signature VARCHAR(128) UNIQUE NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'BUY' or 'SELL'
    token_mint VARCHAR(64) REFERENCES tokens(mint_address),
    amount_sol NUMERIC(12, 6) NOT NULL,
    amount_tokens NUMERIC(30, 0) NOT NULL,
    network_fee_sol NUMERIC(12, 8) NOT NULL,
    priority_fee_sol NUMERIC(12, 8) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RISK & AUDIT EVENTS LOG
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROVIDER HEALTH LOGS
CREATE TABLE IF NOT EXISTS provider_health (
    provider_name VARCHAR(64) PRIMARY KEY,
    is_healthy BOOLEAN NOT NULL DEFAULT TRUE,
    latency_ms INT DEFAULT 0,
    last_check_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_trades_signature ON trades(signature);
CREATE INDEX IF NOT EXISTS idx_decisions_token ON decisions(token_mint);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- INSERT DEFAULT SETTINGS ROW IF NOT EXISTS
INSERT INTO system_settings (id, trading_enabled, kill_switch_active) 
VALUES (1, FALSE, FALSE) 
ON CONFLICT (id) DO NOTHING;
