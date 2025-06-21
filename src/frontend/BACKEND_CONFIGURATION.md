# Backend Configuration Guide

This guide explains how to configure the backend URL for the ZK Shroud Arena frontend.

## Environment Variables

The frontend uses environment variables to configure the backend API URL. This allows easy switching between local development and production backends.

### Configuration Files

1. **`.env.local`** - Your local environment configuration (not committed to git)
2. **`.env.example`** - Example configuration file (committed to git)

### Setting the Backend URL

Edit the `.env.local` file in the frontend directory:

```bash
# For local development (default)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# For production backend
NEXT_PUBLIC_BACKEND_URL=http://34.51.151.9:8080
```

### Switching Between Backends

1. **Local Backend** (default):
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   ```
   Use this when running the backend locally on your machine.

2. **Production Backend**:
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://34.51.151.9:8080
   ```
   Use this to connect to the deployed production backend.

### Applying Changes

After modifying `.env.local`, you need to restart the development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Backend Endpoints

The following endpoints are used by the frontend:

- **`/healthz`** - Health check endpoint
- **`/prove`** - Generate ZK proofs for location
- **`/verify`** - Verify ZK proofs

## Testing Connection

You can test the backend connection using the provided test script:

```bash
node test-backend.js
```

This will test all endpoints and report their status.

## Troubleshooting

### Connection Failed

If you see "Connection Failed" in the UI:

1. **For Local Backend**:
   - Ensure the backend server is running on port 8080
   - Check `docker ps` or your backend logs
   - Try accessing http://localhost:8080/healthz in your browser

2. **For Production Backend**:
   - Check if the server is accessible: `ping 34.51.151.9`
   - Verify the port is open: `nc -zv 34.51.151.9 8080`
   - Contact the backend team if the server is down

### Environment Variables Not Working

- Make sure the variable starts with `NEXT_PUBLIC_`
- Restart the development server after changes
- Clear Next.js cache: `rm -rf .next`

## Backend Status Component

The app includes a `BackendStatus` component that shows:
- Current backend URL
- Connection status (Connected/Disconnected)
- Last check time
- Automatic reconnection every 30 seconds

You can add this component to any page:

```tsx
import { BackendStatus } from '../components/BackendStatus';

// In your component
<BackendStatus />
```