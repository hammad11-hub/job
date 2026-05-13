# HireOS SaaS Monorepo

A premium AI Recruitment Operating System architecture scaffold.

## Quick Start (Local Development)

✅ **Status**: Currently running on localhost

```bash
# Frontend: http://localhost:3000
# API: http://localhost:4000
```

### Start Development
```bash
npm run dev
```

This runs both frontend and backend simultaneously:
- Next.js 14 on port 3000
- NestJS API on port 4000

## Project Structure

- `apps/web` - Next.js marketing + dashboard application
- `apps/api` - NestJS API backend with Prisma ORM
- `packages/ui` - shared design system components
- `packages/types` - shared TypeScript entity definitions

## Features

### AI Recruitment
- **AI Match Analysis**: Intelligent candidate-job matching with confidence scores
- **Recruiter Copilot**: AI-powered insights for hiring decisions
- **Resume Screening**: Automated candidate evaluation

### API Endpoints
- `GET /` - Health check
- `GET /ai/match/demo` - AI matching demo
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /org/me` - Get organization

## Database Setup

### PostgreSQL (Local)
```bash
# The project uses Neon PostgreSQL (cloud)
# DATABASE_URL is pre-configured in .env
```

### Prisma Migrations
```bash
# Run migrations
npm --workspace @hireos/api run prisma:migrate

# Generate Prisma Client
npm --workspace @hireos/api run prisma generate
```

## Production Build

```bash
npm run build
```

Generates:
- Next.js optimized build (`.next/`)
- NestJS compiled code (`dist/`)
- Prisma Client

## Deployment Options

### Docker Compose (Recommended)
```bash
docker-compose up
```

Includes PostgreSQL, API, and Frontend containers.

### Railway (Auto-deploy from Git)
1. Connect GitHub repository
2. Set environment variables
3. Push to deploy

### Vercel (Frontend Only)
```bash
vercel --prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Testing

Run the test suite:
```bash
.\test.ps1
```

Manual API testing:
```bash
# Health check
curl http://localhost:4000/

# AI Matching
curl http://localhost:4000/ai/match/demo

# Frontend
curl http://localhost:3000/
```

## Environment Variables

### Required (API)
```
DATABASE_URL=postgresql://...
PORT=4000
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Optional
```
NODE_ENV=development|production
```

## Build & Deploy

### Development
```bash
npm run dev        # Start with hot reload
npm run lint       # Check code style
```

### Production
```bash
npm run build      # Build all workspaces
npm start          # Run production build
```

## Troubleshooting

### Port Already In Use
```powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Kill process on port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

### Database Connection Error
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL credentials
- Ensure network connectivity

### Build Fails
```bash
# Clear cache and rebuild
rm -r node_modules .next dist
npm install
npm run build
```

## Architecture

```
┌─────────────────────────────────────────┐
│     Next.js Frontend (Port 3000)        │
├─────────────────────────────────────────┤
│          NestJS API (Port 4000)         │
│   ┌─────────────────────────────────┐   │
│   │  Prisma ORM + PostgreSQL        │   │
│   │  • Organizations                │   │
│   │  • Users & Roles                │   │
│   │  • Jobs & Candidates            │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: NestJS 10, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Infrastructure**: Railway, Docker, npm workspaces

## Next Steps

1. ✅ Local development running
2. ✅ Database configured
3. ✅ API endpoints working
4. ✅ Production build tested
5. → Deploy to Railway/Docker
6. → Set up monitoring
7. → Configure CI/CD

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

## Support

For issues or questions, check:
- Terminal output for error messages
- `.env` files for configuration
- Prisma migrations in `saas/apps/api/prisma/migrations/`
- API logs from NestJS

