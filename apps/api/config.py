import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    NODE_ENV: str = "production"
    DATABASE_URL: str = "postgresql://trader_user:SecurePassword123@localhost:5432/solana_trading_db"
    SOLANA_RPC_URL: str = "https://api.mainnet-beta.solana.com"
    TRADING_PRIVATE_KEY: str = ""
    API_SECRET_KEY: str = "DEFAULT_SECRET_CHANGE_ME_IMMEDIATELY_12345678901234567890"
    AUTH_SECRET: str = "DEFAULT_AUTH_SECRET_CHANGE_ME_IMMEDIATELY_1234567890"
    TRADING_ENABLED: bool = False
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
