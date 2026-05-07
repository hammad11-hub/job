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
3. Start the frontend and backend in development:
   ```bash
   npm run dev
   ```

## Recommended architecture

- Next.js App Router for public pages and dashboard
- NestJS backend for APIs, auth, org management, AI services
- PostgreSQL + Prisma for relational data
- Redis for caching and session state
- Vector DB for semantic search and AI matching
- OpenAI for embeddings and recruiter copilot features
