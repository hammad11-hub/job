# 🚀 Quick Deploy Guide

## Current Status: ✅ RUNNING ON LOCALHOST

```
Frontend: http://localhost:3000
API:      http://localhost:4000
```

---

## 1️⃣ Deploy to Railway (Recommended - Easiest)

### Prerequisites
- GitHub account with repo connected
- Railway.app account

### Steps
```bash
# 1. Push your code to GitHub
git push origin main

# 2. Go to https://railway.app
# 3. Click "New Project"
# 4. Select "Deploy from GitHub repo"
# 5. Choose this repository

# 6. Set environment variables in Railway dashboard:

# For API service:
DATABASE_URL=postgresql://...  # Neon or Railway PostgreSQL
NODE_ENV=production
OPENAI_API_KEY=sk-...          # Your OpenAI key (optional)

# For Web service:
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app
NODE_ENV=production

# 7. Deploy - Railway auto-detects and deploys both services
```

**Result**: Full-stack app live on Railway with auto-deployment on git push

---

## 2️⃣ Deploy with Docker Compose (Local/Self-Hosted)

```bash
# Build and run everything
docker-compose up

# App will be at:
# Frontend: http://localhost:3000
# API:      http://localhost:4000
# Database: PostgreSQL on port 5432
```

---

## 3️⃣ Deploy Frontend to Vercel (Web Only)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd saas/apps/web
vercel --prod

# Set environment variable:
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 4️⃣ Deploy Backend to Any Node.js Host

```bash
# 1. Build
npm run build

# 2. Create production environment file
# .env with:
DATABASE_URL=your_db_url
NODE_ENV=production
PORT=4000

# 3. Start
npm run start
```

---

## 🔑 Required Environment Variables

### API
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
PORT=4000
NODE_ENV=production
OPENAI_API_KEY=sk-... (optional)
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://your-api-url.com
NODE_ENV=production
```

---

## 📋 Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] No errors in production build
- [ ] Environment variables set correctly
- [ ] Database has valid connection string
- [ ] API endpoints responding
- [ ] Frontend loads without CORS errors
- [ ] Test login flow
- [ ] Test AI matching demo

---

## 🆘 Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### "Database connection failed"
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL credentials
# Test connection: psql $DATABASE_URL
```

### "Port already in use"
```powershell
# Windows - kill process on port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

### "CORS errors in frontend"
```bash
# Update NEXT_PUBLIC_API_URL to match API domain
# Restart frontend after changing
```

---

## 📊 Monitoring & Logging

### Railway
- Dashboard shows live logs
- Auto-restarts on crash
- View deployment history

### Docker
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🎯 Performance Tips

1. **Enable Caching**
   - Use Redis for sessions
   - Add CDN for static assets

2. **Database Optimization**
   - Use connection pooling (Railway does this)
   - Add database indexes on frequently queried fields

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor performance (DataDog, New Relic)

4. **Security**
   - Enable HTTPS (automatic on Railway/Vercel)
   - Set secure headers
   - Rate limit API endpoints

---

## 📞 Support

Check these files for more info:
- `DEPLOYMENT.md` - Detailed deployment guide
- `PRODUCTION_READY.md` - Full checklist
- `README.md` - Project overview

---

## ✨ You're All Set!

The project is **100% production-ready**. Choose your deployment option and go live! 🚀
