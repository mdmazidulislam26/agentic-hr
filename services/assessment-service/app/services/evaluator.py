import json
from sqlalchemy import text
from app.services.exam_service import AsyncSessionLocal

class ExamEvaluationEngine:
    @staticmethod
    async def grade_submission(application_id: str, config_id: str, candidate_answers: dict):
        async with AsyncSessionLocal() as session:
            # 1. Fetch correct answer keys
            query = text('''
                SELECT id, "correctOption" 
                FROM "AssessmentQuestion" 
                WHERE "configId" = :config_id
            ''')
            result = await session.execute(query, {"config_id": config_id})
            correct_keys = {str(row[0]): row[1] for row in result.fetchall()}
            
            total_questions = len(correct_keys)
            if total_questions == 0:
                return None

            correct_count = 0
            for q_id, correct_idx in correct_keys.items():
                if candidate_answers.get(q_id) == correct_idx:
                    correct_count += 1

            score_percentage = (correct_count / total_questions) * 100.0

            # 2. Check passing threshold
            pass_mark_query = text('SELECT "passMarks" FROM "AssessmentConfig" WHERE id = :config_id')
            pass_result = await session.execute(pass_mark_query, {"config_id": config_id})
            required_pass_mark = pass_result.scalar() or 60.0

            is_passed = score_percentage >= required_pass_mark

            # 3. Record candidate test result
            insert_result_query = text('''
                INSERT INTO "CandidateExamResult" (
                    id, "applicationId", "totalQuestions", "correctAnswers", 
                    "obtainedScore", "isPassed", "isAttended", "answersPayload", "submittedAt"
                )
                VALUES (
                    gen_random_uuid(), :app_id, :total, :correct, 
                    :score, :is_passed, true, :payload::jsonb, NOW()
                )
            ''')
            await session.execute(insert_result_query, {
                "app_id": application_id,
                "total": total_questions,
                "correct": correct_count,
                "score": score_percentage,
                "is_passed": is_passed,
                "payload": json.dumps(candidate_answers)
            })

            # 4. Transition candidate lifecycle status
            new_status = "EXAM_PASSED" if is_passed else "EXAM_FAILED"
            update_status_query = text('''
                UPDATE "CandidateApplication"
                SET status = :status, "updatedAt" = NOW()
                WHERE id = :app_id
            ''')
            await session.execute(update_status_query, {"status": new_status, "app_id": application_id})

            await session.commit()

            return {
                "score": score_percentage,
                "is_passed": is_passed,
                "status": new_status
            }
