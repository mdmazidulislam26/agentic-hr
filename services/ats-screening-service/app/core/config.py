import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://hr_admin:hr_secure_password@localhost:5432/agentic_hr_db?schema=public"
    ).replace("postgresql://", "postgresql+asyncpg://").split("?")[0].split("?")[0]

settings = Settings()
