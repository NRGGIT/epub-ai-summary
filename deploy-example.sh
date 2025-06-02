#!/bin/bash

# EPUB Reader - Example Deployment Script
# This script shows how to deploy the services with Docker
# IMPORTANT: Modify the environment variables before running!

set -e

echo "🚀 Deploying EPUB Reader Services..."

# Create volumes if they don't exist
echo "📦 Creating volumes..."
docker volume create epub-uploads 2>/dev/null || echo "Volume epub-uploads already exists"
docker volume create epub-config 2>/dev/null || echo "Volume epub-config already exists"

# Stop and remove existing containers if they exist
echo "🛑 Stopping existing containers..."
docker stop epub-reader-backend epub-reader-frontend 2>/dev/null || true
docker rm epub-reader-backend epub-reader-frontend 2>/dev/null || true

# Deploy backend
echo "🔧 Deploying backend..."
docker run -d \
  --name epub-reader-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -v epub-uploads:/app/uploads \
  -v epub-config:/app/data \
  -e OPENAI_API_KEY="REPLACE_WITH_YOUR_OPENAI_API_KEY" \
  -e OPENAI_API_ENDPOINT="https://api.openai.com/v1" \
  -e OPENAI_MODEL_NAME="gpt-4" \
  -e DEFAULT_RATIO="0.3" \
  epub-reader-backend:latest

echo "✅ Backend deployed"

# Wait a moment for backend to start
sleep 5

# Deploy frontend
echo "🎨 Deploying frontend..."
docker run -d \
  --name epub-reader-frontend \
  --restart unless-stopped \
  -p 80:80 \
  -e VITE_BACKEND_URL="http://localhost:3001/api" \
  epub-reader-frontend:latest

echo "✅ Frontend deployed"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Service URLs:"
echo "Frontend: http://localhost"
echo "Backend: http://localhost:3001"
echo "Backend Health: http://localhost:3001/api/health"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Replace OPENAI_API_KEY with your actual API key"
echo "2. For production, use proper domain names instead of localhost"
echo "3. Configure HTTPS termination at load balancer level"
echo "4. VITE_BACKEND_URL must include /api path (e.g., https://your-domain.com/api)"
echo ""
echo "📖 See deployment.md for production deployment instructions"
