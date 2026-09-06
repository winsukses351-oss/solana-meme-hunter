const { getDbPool } = require("./db");

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_settings (
  id SERIAL PRIMARY KEY,
  max_position_size_usd NUMERIC(12, 2) DEFAULT 50.00,
  max_daily_loss_usd NUMERIC(12, 2) DEFAULT 100.00,
  stop_loss_percentage NUMERIC(5, 2) DEFAULT 10.00,
  take_profit_percentage NUMERIC(5, 2) DEFAULT 20.00,
  max_open_positions INT DEFAULT 3,
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  address VARCHAR(88) UNIQUE NOT NULL,
  label VARCHAR(50),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(88) UNIQUE NOT NULL,
  symbol VARCHAR(20),
  name VARCHAR(100),
  decimals INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_metrics (
  id SERIAL PRIMARY KEY,
  token_id INT REFERENCES tokens(id) ON DELETE CASCADE,
  price_usd NUMERIC(20, 8),
  liquidity_usd NUMERIC(15, 2),
  volume_24h_usd NUMERIC(15, 2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  trade_uid VARCHAR(64) UNIQUE NOT NULL,
  token_id INT REFERENCES tokens(id),
  side VARCHAR(10) NOT NULL,
  size_usd NUMERIC(12, 2) NOT NULL,
  entry_price NUMERIC(20, 8),
  exit_price NUMERIC(20, 8),
  gross_pnl NUMERIC(12, 2),
  net_pnl NUMERIC(12, 2),
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  trade_id INT REFERENCES trades(id) ON DELETE CASCADE,
  token_id INT REFERENCES tokens(id),
  entry_price NUMERIC(20, 8) NOT NULL,
  current_price NUMERIC(20, 8),
  size_tokens NUMERIC(20, 8) NOT NULL,
  tp_price NUMERIC(20, 8),
  sl_price NUMERIC(20, 8),
  status VARCHAR(20) DEFAULT 'OPEN',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_events (
  id SERIAL PRIMARY KEY,
  trade_id INT REFERENCES trades(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  source VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_health (
  id SERIAL PRIMARY KEY,
  provider_name VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_status (
  worker_name VARCHAR(50) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_metrics_token ON token_metrics(token_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at);
`;

async function runMigrations() {
  console.log("[Migration]: Checking database connection...");
  const pool = getDbPool();

  if (!pool) {
    console.warn("[Migration]: Skipped. DATABASE_URL is not set.");
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      console.log("[Migration]: Executing schema initialization...");
      await client.query(SCHEMA_SQL);
      console.log("[Migration]: Schema successfully created or validated.");
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Migration Error]: Failed to apply schema:", error.message);
    throw error;
  }
}

module.exports = {
  runMigrations,
};
