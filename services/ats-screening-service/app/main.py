import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.services.pdf_extractor import PDFExtractionService
from app.services.llm_matcher import LLMMatchingEngine
from app.services.db_client import DatabaseService

app = FastAPI(title="ATS Screening Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

matcher = LLMMatchingEngine()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ats-screening-service"}

# 📄 ডাউনলোড বন্ধ করে সরাসরি ব্রাউজারের ভেতর Inline PDF দেখানোর এন্ডপয়েন্ট
@app.get("/api/v1/ats/resume/{candidate_id}")
async def get_candidate_pdf(candidate_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{candidate_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Original PDF file not found on server.")
    
    return FileResponse(
        file_path, 
        media_type="application/pdf", 
        content_disposition_type="inline"
    )

@app.post("/api/v1/ats/evaluate", status_code=status.HTTP_200_OK)
async def evaluate_resume(
    job_id: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(...),
    resume: UploadFile = File(...)
):
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    job = await DatabaseService.get_job_details(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Target job requisition not found.")
    
    if job["status"] != "ACTIVE":
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications.")

    pdf_bytes = await resume.read()
    resume_text = PDFExtractionService.extract_text_from_bytes(pdf_bytes)

    evaluation = await matcher.evaluate_fit(
        resume_text=resume_text,
        job_title=job["title"],
        job_description=job["description"],
        min_threshold=job["threshold"]
    )

    if evaluation.ats_score < job["threshold"]:
        return {
            "status": "REJECTED",
            "message": f"Application rejected. Your ATS score ({evaluation.ats_score}%) is below required threshold ({job['threshold']}%).",
            "ats_score": evaluation.ats_score,
            "saved_to_db": False,
            "missing_skills": evaluation.missing_skills
        }

    try:
        candidate_id = await DatabaseService.save_qualified_candidate(
            job_id=job_id,
            full_name=full_name,
            email=email,
            phone=phone_number,
            resume_text=resume_text,
            score=evaluation.ats_score,
            summary=evaluation.summary,
            matched_skills=evaluation.matched_skills,
            missing_skills=evaluation.missing_skills
        )

        file_path = os.path.join(UPLOAD_DIR, f"{candidate_id}.pdf")
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="An application with this email already exists for this job.")
        raise HTTPException(status_code=500, detail="Database insertion failed.")

    return {
        "status": "ACCEPTED",
        "message": f"Congratulations! Your application has been accepted with a {evaluation.ats_score}% match score.",
        "candidate_id": candidate_id,
        "ats_score": evaluation.ats_score,
        "matched_skills": evaluation.matched_skills,
        "saved_to_db": True
    }
