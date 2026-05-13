# Deployment Guide for HireOS

## Local Development (Already Working)

Frontend: `http://localhost:3000`
Backend API: `http://localhost:4000`

```bash
npm run dev
```

## Production Build

Build all workspaces:

```bash
npm run build
```

This will:
- Build Next.js frontend
- Build NestJS API with Prisma
- Generate Prisma Client

## Environment Variables

### API (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/hireos
PORT=4000
NODE_ENV=production
OPENAI_API_KEY=your-key
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Web (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.example.com
NODE_ENV=production
```

## Docker Deployment

### Single Container (all services)
```bash
docker build -t hireos .
docker run -p 3000:3000 -p 4000:4000 hireos
```

### Docker Compose (recommended)
```bash
docker-compose up
```

This starts:
- PostgreSQL database on port 5432
- NestJS API on port 4000
- Next.js frontend on port 3000

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Railway auto-detects `apps/web` and `apps/api` services
3. Set environment variables:
   - **API**: DATABASE_URL, OPENAI_API_KEY, NODE_ENV=production
   - **Web**: NEXT_PUBLIC_API_URL, NODE_ENV=production
4. Deploy automatically on git push

## Vercel Deployment (Frontend only)

```bash
vercel --prod
```

Set environment variable: `NEXT_PUBLIC_API_URL=https://api.example.com`

## Database Setup

### Local PostgreSQL
```bash
# Create database
createdb hireos

# Run migrations
npm --workspace @hireos/api run prisma:migrate
```

### Neon (Serverless PostgreSQL)
1. Create database at https://neon.tech
2. Copy connection string to DATABASE_URL

## API Endpoints

### Health
- `GET /` - API health check

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Organization
- `GET /org/me` - Get current organization

### AI Features
- `GET /ai/match/demo` - AI matching demo

## Testing

Test API locally:
```bash
curl http://localhost:4000/
curl -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'
curl http://localhost:4000/ai/match/demo
```

Test frontend:
```bash
curl http://localhost:3000/
```

## Troubleshooting

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check network connectivity (for cloud databases)

### Port already in use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Prisma errors
```bash
npm --workspace @hireos/api run prisma generate
npm --workspace @hireos/api run prisma:migrate
```

## Performance Optimization

1. Enable Redis for session caching
2. Add CDN for static assets
3. Implement database connection pooling
4. Add monitoring with Sentry or DataDog
5. Enable gzip compression in nginx
