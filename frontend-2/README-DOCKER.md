# Frontend-2 Docker Setup

This document describes the Docker setup for the frontend-2 React application.

## Overview

The frontend-2 has been refactored to be compatible with Docker deployment and git repository publishing. All hardcoded API endpoints have been removed and replaced with environment variable configuration.

## Files Added/Modified

### Configuration Files
- `.env.example` - Environment variable template
- `Dockerfile` - Multi-stage Docker build configuration
- `nginx.conf` - Nginx configuration for production deployment
- `start.sh` - Startup script for Docker container
- `vite.config.ts` - Updated with proxy configuration for development

### Source Code Changes
- `src/services/api.ts` - Removed hardcoded API URL, now uses environment variables
- `src/vite-env.d.ts` - Added TypeScript definitions for environment variables
- `.gitignore` - Updated to exclude sensitive files and environment variables

## Environment Variables

### Development
For local development, you can leave `VITE_BACKEND_URL` empty in your `.env` file. The application will use the Vite proxy configuration to forward API requests to `http://localhost:3001`.

### Production
For production deployment, set the `VITE_BACKEND_URL` environment variable to your backend API URL including the `/api` path:

```bash
VITE_BACKEND_URL=https://your-backend-domain.com/api
```

## Docker Usage

### Building the Image
```bash
docker build -t epub-reader-frontend-2 .
```

### Running the Container
```bash
# For development (connects to local backend)
docker run -p 80:80 epub-reader-frontend-2

# For production (with custom backend URL)
docker run -p 80:80 -e VITE_BACKEND_URL=https://your-backend.com/api epub-reader-frontend-2
```

## Development Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080` and will proxy API requests to `http://localhost:3001`.

## Production Deployment

The Docker container uses a multi-stage build:
1. **Build stage**: Compiles the React application
2. **Production stage**: Serves the built files using Nginx

The Nginx configuration includes:
- Client-side routing support
- API proxy to backend
- Static asset caching
- Security headers
- Health check endpoint

## Security Considerations

- Environment variables are properly configured
- Sensitive files are excluded from git
- Security headers are set in Nginx
- API keys and secrets are not hardcoded

## Integration with Existing Infrastructure

This frontend-2 follows the same patterns as the original frontend:
- Same environment variable naming convention
- Compatible Docker setup
- Same proxy configuration
- Can be used as a drop-in replacement
