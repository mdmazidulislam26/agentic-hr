import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class CutoffPredictorAgent {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  // Predicts optimal candidate cutoff percentage (X%) using Llama-3.3 heuristics
  async predictOptimalCutoff(jobTitle: string, scores: number[]): Promise<{ predictedCutoffPercentage: number; reason: string }> {
    if (scores.length === 0) {
      return { predictedCutoffPercentage: 0, reason: 'No applicants recorded.' };
    }

    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

    const prompt = `
    You are an Expert Talent Acquisition Analyst.
    Job Requisition: "${jobTitle}"
    Applicant Pool Statistics:
    - Total Candidates: ${scores.length}
    - Highest Score: ${maxScore}%
    - Lowest Score: ${minScore}%
    - Mean Score: ${avgScore}%
    - Top Distribution Sample: [${scores.sort((a,b) => b-a).slice(0, 30).join(', ')}]

    TASK:
    Recommend the optimal cutoff percentage (Top X% of candidates) to advance to next rounds
    while maintaining high talent density.

    Return STRICT JSON:
    {
      "predictedCutoffPercentage": number,
      "reason": "Concise 2-sentence rationale"
    }
    `;

    const response = await this.groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      predictedCutoffPercentage: Number(parsed.predictedCutoffPercentage),
      reason: parsed.reason,
    };
  }
}
