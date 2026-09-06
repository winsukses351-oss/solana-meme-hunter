-- ===========================================
-- Solana AI Trader — Phase 2 Database Schema
-- PostgreSQL
-- ===========================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------
-- users
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- system_settings
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  key           TEXT PRIMARY KEY,
  value         JSONB NOT NULL DEFAULT '{}',
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- risk_settings
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS risk_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_per_trade            NUMERIC(18, 8),
  max_position_size         NUMERIC(18, 8),
  max_open_positions        INTEGER,
  daily_loss_limit          NUMERIC(18, 8),
  weekly_loss_limit         NUMERIC(18, 8),
  max_drawdown              NUMERIC(8, 4),
  min_liquidity             NUMERIC(18, 2),
  max_slippage              NUMERIC(8, 4),
  max_price_impact          NUMERIC(8, 4),
  min_opportunity_score     NUMERIC(8, 4),
  take_profit               NUMERIC(8, 4),
  stop_loss                 NUMERIC(8, 4),
  trailing_stop             NUMERIC(8, 4),
  break_even                BOOLEAN DEFAULT FALSE,
  compounding               BOOLEAN DEFAULT FALSE,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- wallets
-- (private keys / seed phrases MUST never be stored in plaintext)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  public_key      TEXT NOT NULL UNIQUE,
  label           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  -- encrypted_secret is for future use; leave NULL in Phase 2
  encrypted_secret TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- tokens
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address    TEXT NOT NULL UNIQUE,
  symbol          TEXT,
  name            TEXT,
  decimals        INTEGER,
  logo_uri        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- token_metrics
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS token_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  price_usd       NUMERIC(36, 18),
  liquidity_usd   NUMERIC(36, 2),
  volume_24h      NUMERIC(36, 2),
  market_cap      NUMERIC(36, 2),
  smart_money_score NUMERIC(8, 4),
  whale_score     NUMERIC(8, 4),
  momentum_score  NUMERIC(8, 4),
  safety_score    NUMERIC(8, 4),
  opportunity_score NUMERIC(8, 4),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_metrics_token_id ON token_metrics(token_id);
CREATE INDEX IF NOT EXISTS idx_token_metrics_recorded_at ON token_metrics(recorded_at DESC);

-- -------------------------------------------
-- positions
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        UUID REFERENCES tokens(id) ON DELETE SET NULL,
  mint_address    TEXT NOT NULL,
  entry_price     NUMERIC(36, 18),
  current_price   NUMERIC(36, 18),
  size_sol        NUMERIC(36, 18),
  size_tokens     NUMERIC(36, 18),
  pnl_usd         NUMERIC(36, 8),
  pnl_percent     NUMERIC(12, 4),
  take_profit     NUMERIC(36, 18),
  stop_loss       NUMERIC(36, 18),
  trailing_stop   NUMERIC(8, 4),
  status          TEXT NOT NULL DEFAULT 'OPEN', -- OPEN | CLOSED | LIQUIDATED
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- -------------------------------------------
-- trades
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id     UUID REFERENCES positions(id) ON DELETE SET NULL,
  token_id        UUID REFERENCES tokens(id) ON DELETE SET NULL,
  mint_address    TEXT NOT NULL,
  side            TEXT NOT NULL, -- BUY | SELL
  size_sol        NUMERIC(36, 18),
  size_tokens     NUMERIC(36, 18),
  entry_price     NUMERIC(36, 18),
  exit_price      NUMERIC(36, 18),
  gross_pnl       NUMERIC(36, 8),
  cost            NUMERIC(36, 8),
  net_pnl         NUMERIC(36, 8),
  status          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | FILLED | FAILED | CANCELLED
  tx_signature    TEXT,
  executed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);

-- -------------------------------------------
-- trade_events
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS trade_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id        UUID REFERENCES trades(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL, -- CREATED | SUBMITTED | CONFIRMED | FAILED | etc.
  payload         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_events_trade_id ON trade_events(trade_id);

-- -------------------------------------------
-- system_logs
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           TEXT NOT NULL DEFAULT 'INFO', -- DEBUG | INFO | WARN | ERROR
  source          TEXT,
  message         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- -------------------------------------------
-- api_health
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS api_health (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL, -- birdeye | dexscreener | jupiter | solana_rpc | backend | database
  status          TEXT NOT NULL, -- CONNECTED | NOT_CONNECTED | ERROR | NOT_CONFIGURED
  latency_ms      INTEGER,
  message         TEXT,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_health_provider ON api_health(provider);
CREATE INDEX IF NOT EXISTS idx_api_health_checked_at ON api_health(checked_at DESC);

-- -------------------------------------------
-- worker_status
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS worker_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name     TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'STOPPED', -- RUNNING | STOPPED | ERROR | BLOCKED
  last_heartbeat  TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------
-- Seed minimal system settings (safe defaults)
-- -------------------------------------------
INSERT INTO system_settings (key, value, description)
VALUES
  ('trading_enabled', 'false', 'Master switch for live trading. Must stay false in Phase 2.'),
  ('phase', '"2"', 'Current project phase')
ON CONFLICT (key) DO NOTHING;
