from fastapi import FastAPI, HTTPException, Body
from app.agents.question_generator import DynamicQuestionAgent
from app.services.exam_service import AssessmentDatabaseService
from app.services.evaluator import ExamEvaluationEngine
from app.services.exam_purge import ExamPurgeWorker

app = FastAPI(title="Assessment & Exam Service", version="1.0.0")
generator_agent = DynamicQuestionAgent()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "assessment-service"}

@app.post("/api/v1/assessments/generate/{config_id}")
async def trigger_question_generation(
    config_id: str,
    topics: list[str] = Body(...),
    difficulty: str = Body("MEDIUM"),
    total_questions: int = Body(10),
    num_sets: int = Body(1)
):
    try:
        sets = await generator_agent.generate_exam_paper(
            topics=topics,
            difficulty=difficulty,
            total_questions=total_questions,
            num_sets=num_sets
        )
        await AssessmentDatabaseService.save_generated_questions(config_id, sets)
        return {"status": "SUCCESS", "message": f"{len(sets)} question set(s) generated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/assessments/submit")
async def submit_exam(
    application_id: str = Body(...),
    config_id: str = Body(...),
    answers: dict = Body(...)
):
    result = await ExamEvaluationEngine.grade_submission(application_id, config_id, answers)
    if not result:
        raise HTTPException(status_code=404, detail="Invalid exam config or submission failed.")
    return result

@app.post("/api/v1/assessments/purge-failures/{job_id}")
async def purge_exam_failures(job_id: str):
    result = await ExamPurgeWorker.purge_unqualified_exam_candidates(job_id)
    return result
