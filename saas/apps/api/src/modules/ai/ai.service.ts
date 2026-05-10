import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly defaultJob =
    'Senior React Engineer at a remote-first startup with React, TypeScript, Node.js, remote collaboration, and modern frontend architecture.';
  private readonly defaultCandidate =
    'Strong React experience, 5+ years of frontend development, TypeScript expertise, remote team experience, skilled in component design and scalable UI.';

  async getMatchSummary(jobDescription?: string, candidateProfile?: string) {
    const job = (jobDescription || this.defaultJob).trim();
    const candidate = (candidateProfile || this.defaultCandidate).trim();

    const strengths = this.extractStrengths(job, candidate);
    const concerns = this.extractConcerns(job, candidate);
    const confidence = this.calculateConfidence(strengths.length, concerns.length);

    return {
      summary: this.buildSummary(job, candidate, strengths, concerns),
      confidence,
      strengths,
      concerns,
      nextAction: this.recommendAction(confidence)
    };
  }

  private extractStrengths(job: string, candidate: string) {
    const skills = ['react', 'typescript', 'node.js', 'node', 'remote', 'frontend', 'ui', 'design'];
    return skills.filter((skill) => candidate.toLowerCase().includes(skill) && job.toLowerCase().includes(skill));
  }

  private extractConcerns(job: string, candidate: string) {
    const requiredSkills = ['react', 'typescript', 'node.js', 'node', 'remote'];
    return requiredSkills.filter((skill) => job.toLowerCase().includes(skill) && !candidate.toLowerCase().includes(skill));
  }

  private calculateConfidence(strengthCount: number, concernCount: number) {
    const base = 60;
    const score = base + strengthCount * 10 - concernCount * 12;
    return Math.max(25, Math.min(95, Math.round(score)));
  }

  private buildSummary(job: string, candidate: string, strengths: string[], concerns: string[]) {
    const baseSummary = `This candidate looks like a good fit for the role based on shared experience in key areas.`;
    const strengthPhrase = strengths.length
      ? `They show strength in ${strengths.join(', ')}.`
      : 'There are few clearly matching strengths in the provided profile.';
    const concernPhrase = concerns.length
      ? `Potential gaps include ${concerns.join(', ')}.`
      : 'There are no obvious gaps in the provided profile relative to the role description.';

    return `${baseSummary} ${strengthPhrase} ${concernPhrase}`;
  }

  private recommendAction(confidence: number) {
    if (confidence >= 80) {
      return 'Proceed with detailed screening and prepare interview questions.';
    }
    if (confidence >= 60) {
      return 'Review the candidate’s technical background and ask follow-up questions.';
    }
    return 'Consider additional candidates or clarify the role before moving forward.';
  }
}
