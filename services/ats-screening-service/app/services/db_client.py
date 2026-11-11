from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class DatabaseService:
    @staticmethod
    async def get_job_details(job_id: str):
        async with AsyncSessionLocal() as session:
            query = text('''
                SELECT title, "jobDescription", "minAtsScoreThreshold", status 
                FROM "JobPost" 
                WHERE id = :job_id
            ''')
            result = await session.execute(query, {"job_id": job_id})
            row = result.fetchone()
            if not row:
                return None
            return {
                "title": row[0],
                "description": row[1],
                "threshold": row[2],
                "status": row[3]
            }

    @staticmethod
    async def save_qualified_candidate(
        job_id: str, 
        full_name: str, 
        email: str, 
        phone: str, 
        resume_text: str, 
        score: float, 
        summary: str, 
        matched_skills: list, 
        missing_skills: list
    ) -> str:
        async with AsyncSessionLocal() as session:
            query = text('''
                INSERT INTO "CandidateApplication" (
                    id, "jobId", "fullName", email, "phoneNumber", 
                    "resumeUrl", "resumeTextExtracted", "atsScore", 
                    "atsMatchSummary", "matchedSkills", "missingSkills", 
                    status, "createdAt", "updatedAt"
                )
                VALUES (
                    gen_random_uuid(), :job_id, :name, :email, :phone,
                    'https://supabase.temp/cv_uploaded', :resume_text, :score,
                    :summary, :matched, :missing,
                    'ATS_QUALIFIED', NOW(), NOW()
                )
                RETURNING id;
            ''')
            result = await session.execute(query, {
                "job_id": job_id,
                "name": full_name,
                "email": email,
                "phone": phone,
                "resume_text": resume_text,
                "score": score,
                "summary": summary,
                "matched": matched_skills,
                "missing": missing_skills
            })
            await session.commit()
            candidate_id = result.scalar()
            return str(candidate_id)
