from sqlalchemy import text
from app.services.exam_service import AsyncSessionLocal

class ExamPurgeWorker:
    @staticmethod
    async def purge_unqualified_exam_candidates(job_id: str):
        async with AsyncSessionLocal() as session:
            # Delete candidates who failed or were absent from the assessment round
            purge_query = text('''
                DELETE FROM "CandidateApplication"
                WHERE "jobId" = :job_id
                AND (
                    status IN ('EXAM_FAILED', 'SHORTLISTED', 'EXAM_INVITED')
                    OR id IN (
                        SELECT "applicationId" 
                        FROM "CandidateExamResult" 
                        WHERE "isPassed" = false OR "isAttended" = false
                    )
                );
            ''')
            
            result = await session.execute(purge_query, {"job_id": job_id})
            await session.commit()
            
            return {
                "purged_count": result.rowcount,
                "message": f"Successfully deleted {result.rowcount} failed or absent applicants from database."
            }
