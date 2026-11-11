import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://hr_admin:hr_secure_password@localhost:5432/agentic_hr_db?schema=public"
).replace("postgresql://", "postgresql+asyncpg://").split("?")[0]

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class AssessmentDatabaseService:
    @staticmethod
    async def save_generated_questions(config_id: str, question_sets: list):
        async with AsyncSessionLocal() as session:
            for q_set in question_sets:
                set_name = q_set.set_name
                for q in q_set.questions:
                    query = text('''
                        INSERT INTO "AssessmentQuestion" (
                            id, "configId", "setIdentifier", "questionText", 
                            options, "correctOption", "timeLimitSec", explanation
                        )
                        VALUES (
                            gen_random_uuid(), :config_id, :set_id, :text, 
                            :options::jsonb, :correct, :time_limit, :explanation
                        );
                    ''')
                    await session.execute(query, {
                        "config_id": config_id,
                        "set_id": set_name,
                        "text": q.question_text,
                        "options": json.dumps(q.options),
                        "correct": q.correct_option_index,
                        "time_limit": q.time_limit_sec,
                        "explanation": q.explanation
                    })
            await session.commit()
