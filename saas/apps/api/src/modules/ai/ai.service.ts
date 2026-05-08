import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.client = null;
      return;
    }

    this.client = new OpenAI({ apiKey });
  }

  async getMatchSummary(jobDescription?: string, candidateProfile?: string) {
    if (!this.client) {
      return {
        summary: 'AI is not configured yet. Set OPENAI_API_KEY to enable AI match insights.',
        confidence: 0
      };
    }

    try {
      const defaultJob = 'Senior React Engineer at a remote-first startup with React, TypeScript, Node.js, remote collaboration, and modern frontend architecture.';
      const defaultCandidate = 'Strong React experience, 5+ years of frontend development, TypeScript expertise, remote team experience, skilled in component design and scalable UI.';

      const job = jobDescription || defaultJob;
      const candidate = candidateProfile || defaultCandidate;

      const prompt = `You are an AI recruiter. Analyze the following job and candidate profile and provide:
1. A brief match summary (2-3 sentences)
2. Key strengths of this candidate for the role
3. Potential concerns or gaps
4. Overall match confidence (0-100%)
5. Next recommended action

Job: ${job}
Candidate: ${candidate}

Format your response as JSON with keys: summary, strengths, concerns, confidence, nextAction`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || 'Unable to generate summary',
        confidence: parsed.confidence || 0,
        strengths: parsed.strengths || [],
        concerns: parsed.concerns || [],
        nextAction: parsed.nextAction || 'Review manually'
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new InternalServerErrorException('Failed to generate AI match summary');
    }
  }
}
