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

  async getMatchSummary() {
    if (!this.client) {
      return {
        summary: 'AI is not configured yet. Set OPENAI_API_KEY to enable AI match insights.',
        confidence: 0
      };
    }

    try {
      const prompt = `You are an AI recruiter. Analyze the following job and candidate profile and summarize the match, strengths, and next best action.

Job: Senior React Engineer at a remote-first startup with React, TypeScript, Node.js, remote collaboration, and modern frontend architecture.
Candidate: Strong React experience, 5+ years of frontend development, TypeScript expertise, remote team experience, skilled in component design and scalable UI.`;

      const response = await this.client.responses.create({
        model: 'gpt-4.1-mini',
        input: prompt,
        max_output_tokens: 220,
        temperature: 0.2
      });

      const summary = response.output_text?.trim() || '';
      return {
        summary: summary || 'AI completed the request but returned no text.',
        confidence: 0.94
      };
    } catch (error) {
      throw new InternalServerErrorException('AI match generation failed.');
    }
  }
}
