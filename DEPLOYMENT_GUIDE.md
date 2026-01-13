# Deployment Guide - Multi-Cloud Dashboard

## Architecture Overview

Your application consists of:
- **Frontend**: React + Vite (Port 3000)
- **Backend**: Node.js + Express (Port 5000)

## Deployment Options

### Option 1: Split Deployment (Recommended)

#### Frontend → Netlify
- Static site hosting
- Free tier available
- Automatic HTTPS
- CDN included

#### Backend → Render.com / Railway.app
- Node.js hosting
- Free tier available
- Automatic HTTPS
- Database support

### Option 2: Full-Stack Deployment

#### Both → Render.com or Railway.app
- Single platform
- Easier management
- Monorepo support

---

## 🚀 Deployment Steps

### Step 1: Connect to Bitbucket

```bash
# Navigate to project directory
cd c:\Users\Anjan\Downloads\CascadeProjects\multi-cloud-dashboard

# Initialize Git (if not already done)
git init

# Add Bitbucket remote
git remote add origin https://bitbucket.org/multicloud9/multi-cloud-dashboard.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - Multi-cloud dashboard with RBAC"

# Push to Bitbucket
git push -u origin main
```

### Step 2: Deploy Frontend to Netlify

#### A. Via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build frontend
npm run build

# Deploy
netlify deploy --prod
```

#### B. Via Netlify Dashboard
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose Bitbucket
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: (leave empty)

#### Environment Variables for Netlify:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 3: Deploy Backend to Render.com

#### A. Via Render Dashboard
1. Go to https://render.com/
2. Click "New" → "Web Service"
3. Connect your Bitbucket repository
4. Configure:
   - **Name**: multi-cloud-dashboard-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Port**: 5000

#### Environment Variables for Render:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-super-secret-session-key-change-this
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app

# AWS (if using)
AWS_REGION=us-east-1
AUTH_METHOD=iam-role

# OAuth (if configured)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.onrender.com/auth/google/callback
FRONTEND_URL=https://your-netlify-site.netlify.app
```

---

## 📁 Required Configuration Files

### 1. netlify.toml (Frontend)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 2. render.yaml (Backend)
```yaml
services:
  - type: web
    name: multi-cloud-dashboard-api
    env: node
    buildCommand: npm install
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
```

### 3. .gitignore (Update)
```
# Dependencies
node_modules/
npm-debug.log*

# Environment
.env
.env.local
.env.production

# Build
dist/
build/

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Credentials
gcp-credentials.json
```

---

## 🔧 Code Changes for Production

### Update Frontend API URL

Create `src/config.js`:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Update API calls in your components to use `API_URL`:
```javascript
import { API_URL } from './config';

// Instead of: fetch('http://localhost:5000/api/dashboard')
fetch(`${API_URL}/api/dashboard`)
```

### Update Backend CORS

Already configured in `server/index.js`:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
```

---

## 🔐 Security Checklist

Before deploying:

- [ ] Change JWT_SECRET to strong random value
- [ ] Change SESSION_SECRET to strong random value
- [ ] Update ALLOWED_ORIGINS to your Netlify URL
- [ ] Remove any hardcoded credentials
- [ ] Enable HTTPS (automatic on Netlify/Render)
- [ ] Set NODE_ENV=production
- [ ] Review .gitignore (no secrets committed)
- [ ] Change Super Admin password after deployment

---

## 🚀 Alternative: Deploy Both to Render.com

If you want everything on one platform:

### render.yaml (Full-Stack)
```yaml
services:
  # Backend API
  - type: web
    name: multi-cloud-dashboard-api
    env: node
    buildCommand: npm install
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: ALLOWED_ORIGINS
        value: https://multi-cloud-dashboard.onrender.com

  # Frontend
  - type: web
    name: multi-cloud-dashboard-frontend
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://multi-cloud-dashboard-api.onrender.com
```

---

## 📊 Monitoring & Logs

### Netlify
- View logs: Netlify Dashboard → Site → Deploys → Deploy log
- Monitor: Netlify Analytics (paid)

### Render
- View logs: Render Dashboard → Service → Logs
- Monitor: Built-in metrics (CPU, Memory, Requests)

### Application Logs
Your app logs to:
- `logs/access.log` - HTTP requests
- `logs/audit.log` - User actions

**Note**: In production, consider using:
- CloudWatch (AWS)
- Application Insights (Azure)
- Cloud Logging (GCP)

---

## 🔄 CI/CD Pipeline

### Automatic Deployment
Both Netlify and Render support automatic deployment:

1. Push to Bitbucket
2. Webhook triggers build
3. Automatic deployment
4. Zero downtime

### Manual Deployment
```bash
# Frontend (Netlify)
npm run build
netlify deploy --prod

# Backend (Render)
git push origin main
# Render auto-deploys on push
```

---

## 🧪 Testing Deployment

### 1. Test Frontend
```bash
# Visit your Netlify URL
https://your-site.netlify.app

# Check console for errors
# Verify API connection
```

### 2. Test Backend
```bash
# Health check
curl https://your-backend.onrender.com/api/health

# Login test
curl -X POST https://your-backend.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"ChangeMe@123"}'
```

### 3. Test Full Flow
1. Open frontend URL
2. Login with Super Admin
3. View dashboard
4. Check audit logs

---

## 💰 Cost Estimate

### Free Tier (Recommended for Testing)
- **Netlify**: 100GB bandwidth/month (Free)
- **Render**: 750 hours/month (Free)
- **Total**: $0/month

### Production (Recommended)
- **Netlify Pro**: $19/month
- **Render Starter**: $7/month
- **Total**: $26/month

### Enterprise
- **AWS/Azure/GCP**: $50-200/month
- Includes: Load balancing, auto-scaling, managed databases

---

## 🆘 Troubleshooting

### Issue: CORS errors
**Solution**: Update ALLOWED_ORIGINS in backend env vars

### Issue: API not connecting
**Solution**: Check VITE_API_URL in frontend env vars

### Issue: Build fails
**Solution**: Check Node version (use 18+)

### Issue: Environment variables not working
**Solution**: Restart service after updating env vars

---

## 📞 Support

- **Netlify Docs**: https://docs.netlify.com/
- **Render Docs**: https://render.com/docs
- **Bitbucket Docs**: https://support.atlassian.com/bitbucket-cloud/

---

**Ready to deploy!** Follow the steps above or let me know which deployment option you prefer.
