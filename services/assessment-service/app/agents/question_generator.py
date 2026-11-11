import os
import json
from typing import List
from groq import Groq
from pydantic import BaseModel, Field

class GeneratedQuestion(BaseModel):
    question_text: str
    options: List[str] = Field(..., min_length=4, max_length=4)
    correct_option_index: int = Field(..., ge=0, le=3)
    time_limit_sec: int = Field(default=60)
    explanation: str

class QuestionSetPayload(BaseModel):
    set_name: str
    questions: List[GeneratedQuestion]

class DynamicQuestionAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "openai/gpt-oss-20b"

    async def generate_exam_paper(
        self, 
        topics: List[str], 
        difficulty: str, 
        total_questions: int, 
        num_sets: int = 1
    ) -> List[QuestionSetPayload]:
        
        system_prompt = f"""
        You are an Expert Psychometrician and Technical Assessment Architect.
        Generate {num_sets} distinct question sets of multiple-choice questions (MCQs).
        
        TOPICS: {', '.join(topics)}
        DIFFICULTY: {difficulty}
        QUESTIONS PER SET: {total_questions}

        GUIDELINES:
        1. Test practical reasoning and foundational competence. Avoid rote trivia.
        2. Provide exactly 4 options per question.
        3. Index of correct answer must be 0, 1, 2, or 3.
        4. Assign a time limit in seconds (30 to 90s) per question.
        5. Return STRICT JSON matching:
        {{
          "sets": [
            {{
              "set_name": "Set A",
              "questions": [
                {{
                  "question_text": "string",
                  "options": ["A", "B", "C", "D"],
                  "correct_option_index": 0,
                  "time_limit_sec": 60,
                  "explanation": "string"
                }}
              ]
            }}
          ]
        }}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        raw_data = json.loads(response.choices[0].message.content)
        result_sets = []
        for s in raw_data.get("sets", []):
            result_sets.append(QuestionSetPayload(**s))
        return result_sets
