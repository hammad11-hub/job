# Railway Deployment Guide

## Quick Setup

1. **Push to GitHub** ✅ (Already done)
   ```bash
   git push origin main
   ```

2. **Connect to Railway**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose: `hammad11-hub/job`

3. **Railway Auto-Detection**
   - Railway will detect `railway.toml` in the root
   - It will build the entire monorepo as one service
   - Both API and Web will run on the same Railway service

4. **Set Environment Variables**
   - Go to Railway Dashboard > Project > Variables
   - Add these variables:

```
DATABASE_URL=postgresql://user:pass@host:port/dbname
NODE_ENV=production
OPENAI_API_KEY=sk-... (optional)
PORT=4000
```

5. **Deploy**
   - Railway auto-deploys on git push
   - Both services (API and Web) will start with `npm run dev`
   - Frontend available on port 3000
   - API available on port 4000

---

## For Separate Services (Advanced)

If you want API and Web as separate Railway services:

### Option A: Create separate GitHub repositories
- Fork or create separate repos for API and Web
- Deploy each separately to Railway

### Option B: Use Railway's Services feature
Contact Railway support for monorepo services configuration

---

## Troubleshooting Railway Builds

### Error: "failed to calculate checksum"
This was caused by incorrect Docker paths. Fixed by:
- Removing service-level Dockerfiles
- Using nixpacks builder (auto-detects Node.js projects)
- Using workspace commands in root package.json

### Deployment logs not showing
- Check Railway Dashboard > Project > Deployments
- View build and runtime logs there

### Services not connecting
- Ensure NEXT_PUBLIC_API_URL is set in environment
- Use Railway's internal URLs for service-to-service communication:
  ```
  http://api:4000  (internal Railway networking)
  ```

---

## Database Setup

Railway provides PostgreSQL as an add-on. To enable:

1. Go to Railway Dashboard > Plugins
2. Click "PostgreSQL"
3. Railway auto-sets DATABASE_URL
4. Migrations run automatically on deployment

---

## Custom Domain

1. Go to Railway Project > Settings > Domains
2. Add your custom domain
3. Update NEXT_PUBLIC_API_URL to your domain

---

## Monitoring & Logs

Railway provides:
- Real-time logs in Dashboard
- Deployment history
- Auto-restart on crashes
- Environment variable management

---

## Git Push to Deploy

Any push to `main` will:
1. Trigger Railway build
2. Run migrations if database is configured
3. Deploy automatically
4. Restart the service

No manual deployment needed!
