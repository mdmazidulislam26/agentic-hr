import os
import json
from groq import Groq
from app.core.config import settings
from app.models.ats_schemas import ATSScoreResult

class LLMMatchingEngine:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "openai/gpt-oss-20b"

    async def evaluate_fit(
        self, 
        resume_text: str, 
        job_title: str, 
        job_description: str, 
        min_threshold: float = 75.0
    ) -> ATSScoreResult:
        
        system_prompt = f"""
        You are an advanced, strict Enterprise ATS (Applicant Tracking System) Evaluation Agent.
        Your task is to analyze candidate resumes against Job Descriptions (JD).
        
        Evaluation Weights:
        1. Core Hard Skills & Tool Match (40%)
        2. Relevant Experience & Project Complexity (35%)
        3. Education & Certifications (15%)
        4. Readability & Clear Impact (10%)

        The required qualification threshold is {min_threshold}%.
        You MUST respond ONLY with a valid JSON object matching this schema:
        {{
            "ats_score": float,
            "is_fit": boolean,
            "matched_skills": [string],
            "missing_skills": [string],
            "summary": string
        }}
        """

        user_content = f"""
        TARGET JOB TITLE: {job_title}
        TARGET JOB DESCRIPTION:
        {job_description}

        CANDIDATE EXTRACTED RESUME:
        {resume_text}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        data = json.loads(response.choices[0].message.content)
        return ATSScoreResult(**data)
