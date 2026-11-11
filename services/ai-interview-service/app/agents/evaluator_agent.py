import os
import json
from groq import Groq
from pydantic import BaseModel, Field

class CandidateScorecard(BaseModel):
    technical_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    behavioral_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    strengths_summary: str
    weaknesses_summary: str
    ai_recommendation: str

class InterviewEvaluatorAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-20b"

    async def evaluate_interview_session(
        self, 
        qa_transcript: list, 
        job_description: str
    ) -> CandidateScorecard:
        
        system_prompt = """
        You are a Ruthless, Highly Critical Enterprise Technical Bar-Raiser and Executive Hiring Auditor.
        Your reputation depends on rejecting unqualified candidates and only recommending genuine experts.
        
        CRITICAL EVALUATION RULES:
        1. BE STRICT AND UNFORGIVING: Do NOT be polite. If answers are short, vague, buzzword-laden, missing architecture specifics, or candidate was silent, heavily penalize.
        2. PENALTY CRITERIA:
           - Answer is empty, silent, '[Answered]', or < 15 words: Score 0 - 25 for that question.
           - Candidate uses generic fluff without explaining "HOW" or "WHY": Score 25 - 50.
           - Candidate demonstrates clear technical reasoning, mentions real trade-offs, architecture: Score 75 - 95.
        3. SCORING WEIGHTS:
           - technical_score (50% weight): Depth, accuracy, implementation details.
           - communication_score (30% weight): Clarity, structure (STAR method), conciseness.
           - behavioral_score (20% weight): Professional maturity, ownership, realism.
           - overall_score: (technical_score * 0.5) + (communication_score * 0.3) + (behavioral_score * 0.2)
        4. RECOMMENDATION THRESHOLDS:
           - overall_score < 60: STRICTLY "NOT_RECOMMENDED"
           - overall_score 60 - 79: "CONSIDER"
           - overall_score >= 80: ONLY IF ANSWERS ARE TRULY EXEMPLARY -> "HIGHLY_RECOMMENDED"
        5. WEAKNESSES SUMMARY: Must explicitly list what specific concepts the candidate failed to explain or where their reasoning was shallow.
        
        Return STRICT JSON matching this schema:
        {
          "technical_score": float,
          "communication_score": float,
          "behavioral_score": float,
          "overall_score": float,
          "strengths_summary": "string",
          "weaknesses_summary": "string",
          "ai_recommendation": "HIGHLY_RECOMMENDED" | "CONSIDER" | "NOT_RECOMMENDED"
        }
        """

        user_content = f"""
        TARGET JOB DESCRIPTION:
        {job_description}

        ACTUAL CANDIDATE Q&A TRANSCRIPT:
        {json.dumps(qa_transcript, indent=2)}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )

        data = json.loads(response.choices[0].message.content)
        return CandidateScorecard(**data)
