# Vercel Deployment Guide

## Quick Deploy to Vercel

### 1. Deploy with Vercel CLI (Recommended)
```bash
cd src/frontend
npx vercel --prod
```

### 2. Set up Custom Domain (zksolutions.org)

After deployment, follow these steps:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Domains" tab
   - Click "Add Domain"
   - Enter: `zksolutions.org`
   - Also add: `www.zksolutions.org`

2. **Configure DNS Records:**
   Add these records to your domain registrar:

   **For apex domain (zksolutions.org):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Environment Variables:**
   Set these in Vercel dashboard under Settings > Environment Variables:
   ```
   BACKEND_URL=https://your-backend-url.com
   NODE_ENV=production
   ```

### 3. Alternative: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Select the branch: `feat/homepage-improvement`
3. Set the root directory: `src/frontend`
4. Deploy

### 4. SSL Certificate
Vercel automatically provisions SSL certificates for your custom domain. This usually takes a few minutes after DNS propagation.

### 5. Backend Configuration
Since we removed the hardcoded IP, ensure you set the `BACKEND_URL` environment variable in Vercel to point to your backend server.

## Verification
After deployment, verify:
- ✅ Homepage loads at https://www.zksolutions.org (redirects from zksolutions.org)
- ✅ Navigation buttons work (/player, /gm)
- ✅ No server IPs are exposed in the frontend
- ✅ Backend connection status shows correctly

## Latest Deployment
- Production URL: https://www.zksolutions.org
- Backend URL: http://34.51.151.9:8080 (configured via BACKEND_URL env var)
- Deployment Date: December 2024