# Quick Deployment Guide - Fix Common Issues

## Problem: Netlify and Render Deployments Failing

Your app has both frontend (React) and backend (Node.js) in the same repository. This causes confusion during deployment.

---

## ✅ Solution: Proper Configuration

### Step 1: Push Updated Code to Bitbucket

```bash
# Add the updated configuration files
git add netlify.toml render.yaml

# Commit
git commit -m "Fix: Update deployment configs for Netlify and Render"

# Push to Bitbucket
git push origin master
```

---

## Step 2: Configure Netlify (Frontend Only)

### A. In Netlify Dashboard

1. Go to https://app.netlify.com/
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Build settings**
4. Update settings:
   ```
   Base directory: (leave empty)
   Build command: npm install && npm run build
   Publish directory: dist
   ```

5. Go to **Environment variables**
6. Add this variable:
   ```
   Key: VITE_API_URL
   Value: https://your-backend-name.onrender.com
   ```
   (Replace with your actual Render URL from Step 3)

7. **Trigger redeploy**: Deploys → Trigger deploy → Deploy site

### B. What Netlify Does:
- ✅ Installs ALL dependencies (including backend ones - that's OK)
- ✅ Builds ONLY the frontend (`npm run build`)
- ✅ Deploys ONLY the `dist` folder (frontend static files)
- ✅ Ignores backend code

---

## Step 3: Configure Render (Backend Only)

### A. In Render Dashboard

1. Go to https://dashboard.render.com/
2. Click **New** → **Web Service**
3. Connect to your Bitbucket repository
4. Configure:
   ```
   Name: multi-cloud-dashboard-api
   Environment: Node
   Branch: master
   Root Directory: (leave empty)
   Build Command: npm install --legacy-peer-deps
   Start Command: node server/index.js
   ```

5. Add environment variables:
   ```
   NODE_ENV = production
   PORT = 5000
   JWT_SECRET = <click "Generate" button>
   SESSION_SECRET = <click "Generate" button>
   ALLOWED_ORIGINS = https://your-netlify-site.netlify.app
   AUTH_METHOD = iam-role
   AWS_REGION = us-east-1
   ```

6. Click **Create Web Service**

### B. What Render Does:
- ✅ Installs ALL dependencies (including frontend ones - that's OK)
- ✅ Runs ONLY the backend (`node server/index.js`)
- ✅ Exposes API at port 5000
- ✅ Ignores frontend code

---

## Step 4: Connect Frontend to Backend

After Render deploys, you'll get a URL like:
```
https://multi-cloud-dashboard-api.onrender.com
```

### Update Netlify:
1. Go to Netlify → Site settings → Environment variables
2. Update `VITE_API_URL`:
   ```
   VITE_API_URL = https://multi-cloud-dashboard-api.onrender.com
   ```
3. Trigger redeploy

### Update Render:
1. Go to Render → Your service → Environment
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://your-actual-netlify-site.netlify.app
   ```
3. Save (auto-redeploys)

---

## Step 5: Test Your Deployment

### Test Backend:
```bash
# Health check
curl https://your-backend.onrender.com/api/health

# Should return:
{"status":"ok","timestamp":"...","version":"1.0.0","security":"enabled"}
```

### Test Frontend:
1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Open browser console (F12)
3. Check for errors
4. Try logging in:
   ```
   Username: superadmin
   Password: ChangeMe@123
   ```

---

## Common Issues & Fixes

### Issue 1: "Build failed" on Netlify
**Cause**: Missing dependencies or wrong Node version

**Fix**:
1. Check build log for specific error
2. Ensure Node version is 18+ in `netlify.toml`
3. Try adding `NPM_FLAGS = "--legacy-peer-deps"` to environment variables

### Issue 2: "Build failed" on Render
**Cause**: Missing dependencies or memory limit

**Fix**:
1. Check build log
2. Use `npm install --legacy-peer-deps` in build command
3. Upgrade to paid plan if memory exceeded (free tier: 512MB)

### Issue 3: "CORS error" in browser console
**Cause**: Backend not allowing frontend origin

**Fix**:
1. Update `ALLOWED_ORIGINS` in Render to match your Netlify URL exactly
2. Include `https://` in the URL
3. No trailing slash

### Issue 4: "Cannot connect to API"
**Cause**: Wrong API URL in frontend

**Fix**:
1. Check `VITE_API_URL` in Netlify environment variables
2. Must match your Render URL exactly
3. Include `https://` but NO trailing slash
4. Redeploy frontend after changing

### Issue 5: Backend sleeps (free tier)
**Cause**: Render free tier sleeps after 15 minutes of inactivity

**Fix**:
- First request takes 30-60 seconds to wake up
- Upgrade to paid plan ($7/month) for always-on
- Or accept the delay

---

## Deployment Checklist

- [ ] Code pushed to Bitbucket
- [ ] Netlify connected to Bitbucket repo
- [ ] Netlify build command: `npm install && npm run build`
- [ ] Netlify publish directory: `dist`
- [ ] Netlify environment variable: `VITE_API_URL` set
- [ ] Render connected to Bitbucket repo
- [ ] Render build command: `npm install --legacy-peer-deps`
- [ ] Render start command: `node server/index.js`
- [ ] Render environment variables set (JWT_SECRET, SESSION_SECRET, etc.)
- [ ] Backend URL added to Netlify `VITE_API_URL`
- [ ] Frontend URL added to Render `ALLOWED_ORIGINS`
- [ ] Both sites redeployed
- [ ] Tested login at frontend URL
- [ ] Changed Super Admin password

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  User Browser                                   │
│  https://your-site.netlify.app                  │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ▼
┌─────────────────────────────────────────────────┐
│  Netlify (Frontend)                             │
│  • React App (Static Files)                     │
│  • Vite Build Output                            │
│  • Environment: VITE_API_URL                    │
└────────────────┬────────────────────────────────┘
                 │
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────────┐
│  Render (Backend)                               │
│  https://your-backend.onrender.com              │
│  • Node.js + Express API                        │
│  • User Management (RBAC)                       │
│  • Cloud Provider Integration                   │
│  • Environment: JWT_SECRET, ALLOWED_ORIGINS     │
└────────────────┬────────────────────────────────┘
                 │
                 │ Cloud SDK Calls
                 ▼
┌─────────────────────────────────────────────────┐
│  Cloud Providers                                │
│  • AWS (EC2, S3, RDS)                          │
│  • Azure (VMs, Storage)                         │
│  • GCP (Compute, Storage)                       │
└─────────────────────────────────────────────────┘
```

---

## URLs You Need

After deployment, you'll have:

1. **Frontend URL** (Netlify):
   ```
   https://your-site-name.netlify.app
   ```
   - This is what users visit
   - Shows the React dashboard

2. **Backend URL** (Render):
   ```
   https://multi-cloud-dashboard-api.onrender.com
   ```
   - This is the API
   - Not meant to be visited directly
   - Frontend calls this for data

3. **Bitbucket Repo**:
   ```
   https://bitbucket.org/multicloud9/workspace
   ```
   - Your source code
   - Push changes here
   - Auto-deploys to Netlify and Render

---

## Next Steps After Deployment

1. **Change Super Admin Password**:
   - Login at your Netlify URL
   - Use: `superadmin` / `ChangeMe@123`
   - Change password immediately

2. **Create Users**:
   - Create admin and regular user accounts
   - Test different permission levels

3. **Add Cloud Credentials**:
   - Follow `AWS_SETUP_GUIDE.md`
   - Use IAM roles (recommended)
   - Or add credentials via API

4. **Monitor Logs**:
   - Netlify: Site → Deploys → Deploy log
   - Render: Service → Logs
   - Application: Check `logs/` folder (if persistent storage added)

5. **Set Up Custom Domain** (Optional):
   - Netlify: Site settings → Domain management
   - Add your domain (e.g., `dashboard.yourcompany.com`)

---

## Cost Summary

### Free Tier (Good for Testing):
- Netlify: Free (100GB bandwidth)
- Render: Free (750 hours, sleeps after 15min)
- **Total: $0/month**

### Production (Recommended):
- Netlify Pro: $19/month
- Render Starter: $7/month
- **Total: $26/month**

---

## Support

If you encounter issues:

1. **Check build logs** (most errors are here)
2. **Verify environment variables** (common mistake)
3. **Test API directly** with curl/Postman
4. **Check browser console** for frontend errors
5. **Review `logs/audit.log`** for backend errors

**Netlify Docs**: https://docs.netlify.com/  
**Render Docs**: https://render.com/docs  
**Bitbucket Docs**: https://support.atlassian.com/bitbucket-cloud/

---

**You're ready to deploy!** Follow the steps above in order.
