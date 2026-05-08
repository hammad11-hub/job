# HireOS SaaS Monorepo

A premium AI Recruitment Operating System architecture scaffold.

## What is included

- `apps/web` - Next.js marketing + dashboard application
- `apps/api` - NestJS API backend with Prisma schema
- `packages/ui` - shared design system components
- `packages/types` - shared TypeScript entity definitions

## Getting started

1. Navigate to the `saas` folder:
   ```bash
   cd saas
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy from examples):
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit .env and add your OPENAI_API_KEY for AI features
   ```
4. Start the frontend and backend in development:
   ```bash
   npm run dev
   ```

## AI Features

- **AI Match Analysis**: Get intelligent candidate-job matching with confidence scores
- **Recruiter Copilot**: AI-powered insights for hiring decisions
- **Resume Screening**: Automated candidate evaluation

Visit `http://localhost:3000` to see the AI demo in action.

## Recommended architecture

- Next.js App Router for public pages and dashboard
- NestJS backend for APIs, auth, org management, AI services
- PostgreSQL + Prisma for relational data
- Redis for caching and session state
- Vector DB for semantic search and AI matching
- OpenAI for embeddings and recruiter copilot features
