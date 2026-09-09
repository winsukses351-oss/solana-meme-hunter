import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SOLANA_RPC_URL: str = "https://api.mainnet-beta.solana.com"
    DATABASE_URL: str = "postgresql://solana_user:solana_password@localhost:5432/solana_trader_db"
    TRADING_ENABLED: bool = False
    TRADING_PRIVATE_KEY: str = ""
    BIRDEYE_API_KEY: str = ""
    HELIUS_API_KEY: str = ""
    API_SECRET: str = "default_api_secret_key"
    AUTH_SECRET: str = "default_auth_jwt_secret"
    ENCRYPTION_KEY: str = "default_32_byte_hex_encryption_key"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
