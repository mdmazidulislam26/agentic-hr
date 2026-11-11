import os
import json
from typing import List
from groq import Groq
from pydantic import BaseModel, Field

class InterviewQuestion(BaseModel):
    category: str = Field(..., description="INTRO, SKILL_PROJECT, JD_TECHNICAL, or HR_CUSTOM")
    question_text: str
    difficulty: str
    time_limit_sec: int = Field(default=90)

class InterviewArchitectAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-20b"

    async def generate_tailored_questions(
        self, 
        candidate_cv: str, 
        job_description: str, 
        custom_hr_questions: List[str]
    ) -> List[InterviewQuestion]:
        
        system_prompt = """
        You are an elite, empathetic, yet rigorous Technical Interviewer.
        Generate a dynamic 5-question interview flow tailored to the candidate's CV and the target Job Description (JD).
        
        STRUCTURE:
        - Question 1: Professional introduction and core strengths (60s limit).
        - Question 2 & 3: Deep dive into real projects or skills mentioned in THEIR CV (90s limit each).
        - Question 4: Problem-solving question tied to the target Job Description (120s limit).
        - Question 5: Situational/Culture fit or HR-specified question (90s limit).
        
        Return STRICT JSON matching:
        {
          "questions": [
            {
              "category": "INTRO" | "SKILL_PROJECT" | "JD_TECHNICAL" | "HR_CUSTOM",
              "question_text": "string",
              "difficulty": "EASY" | "MEDIUM" | "HARD",
              "time_limit_sec": integer
            }
          ]
        }
        """

        user_content = f"""
        TARGET JOB DESCRIPTION:
        {job_description}

        CANDIDATE CV TEXT:
        {candidate_cv}

        HR CUSTOM QUESTIONS (MUST INCLUDE IF PRESENT):
        {json.dumps(custom_hr_questions)}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )

        data = json.loads(response.choices[0].message.content)
        return [InterviewQuestion(**q) for q in data.get("questions", [])]
