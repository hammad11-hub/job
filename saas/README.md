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
   # No API keys needed - AI features work offline
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

## Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway

### Deploy to Railway

1. **Connect Repository**:
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Database Setup**:
   - Add PostgreSQL database to your project
   - Railway will provide `DATABASE_URL` automatically

3. **API Service**:
   - Railway will auto-detect the API service in `apps/api/`
   - Set environment variables in Railway dashboard:
     ```
     DATABASE_URL=postgresql://... (auto-provided or from Neon)
     NODE_ENV=production
     ```

4. **Web Service**:
   - Railway will auto-detect the web service in `apps/web/`
   - Set environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-api-service-url.up.railway.app
     NODE_ENV=production
     ```

5. **Deploy**:
   - Push changes to GitHub
   - Railway will automatically deploy both services
   - API will be available at: `https://your-api-service.up.railway.app`
   - Web app at: `https://your-web-service.up.railway.app`

### Environment Variables

**API Service:**
- `DATABASE_URL` - PostgreSQL connection string (Railway auto-provides or from Neon)
- `NODE_ENV` - Set to "production"

**Web Service:**
- `NEXT_PUBLIC_API_URL` - URL of your deployed API service
- `NODE_ENV` - Set to "production"

## Recommended architecture

- Next.js App Router for public pages and dashboard
- NestJS backend for APIs, auth, org management, AI services
- PostgreSQL + Prisma for relational data
- Redis for caching and session state
- Vector DB for semantic search and AI matching
- Offline AI algorithms for recruiter insights
