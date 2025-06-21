# Fix Backend Connection in Vercel

## Quick Fix via CLI

Run this command and enter your backend URL when prompted:
```bash
cd src/frontend
npx vercel env add BACKEND_URL production
```
When prompted, enter: `http://34.51.151.9:8080` (or your actual backend URL)

Then redeploy:
```bash
npx vercel --prod
```

## Alternative: Via Vercel Dashboard

1. Go to: https://vercel.com/nuttakit-kundums-projects/zk-shroud-arena-prod-fix/settings/environment-variables
2. Click "Add Environment Variable"
3. Add:
   - Key: `BACKEND_URL`
   - Value: `http://34.51.151.9:8080` (or your actual backend URL)
   - Environment: ✓ Production
4. Click "Save"
5. Redeploy from the dashboard (click "Redeploy" button)

## Why This Happened

We removed the hardcoded IP for security, but the proxy needs the BACKEND_URL environment variable at build time in Vercel. Without it, the API calls fail.

## Security Note

Setting this as an environment variable in Vercel is more secure than hardcoding it because:
- It's not visible in the source code
- It's only used server-side during the build
- The client never sees the actual backend URL (uses `/api` proxy instead)