import asyncpg
from config import settings

pool = None

async def init_db():
    global pool
    pool = await asyncpg.create_pool(
        dsn=settings.DATABASE_URL,
        min_size=2,
        max_size=10
    )

async def close_db():
    global pool
    if pool:
        await pool.close()

async def get_db():
    global pool
    if not pool:
        await init_db()
    async with pool.acquire() as connection:
        yield connection
