import asyncio
import logging
import os
import asyncpg
from engine.runner import TradingEngineRunner

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("WorkerMain")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://trader_user:SecurePassword123@localhost:5432/solana_trading_db")
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")

async def main():
    logger.info("Starting Persistent Autonomous Trading Worker Service...")
    db_pool = await asyncpg.create_pool(dsn=DATABASE_URL)
    
    runner = TradingEngineRunner(db_pool, SOLANA_RPC_URL)
    
    try:
        await runner.start()
    except KeyboardInterrupt:
        logger.info("Shutdown signal received.")
    finally:
        await runner.stop()
        await db_pool.close()

if __name__ == "__main__":
    asyncio.run(main())
