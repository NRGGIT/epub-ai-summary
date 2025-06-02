#!/bin/bash

# EPUB Reader - Docker Image Build Script
# This script builds both frontend and backend Docker images

set -e

echo "🚀 Building EPUB Reader Docker Images..."

# Build backend image
echo "📦 Building backend image..."
cd backend
docker build -t epub-reader-backend:latest .
echo "✅ Backend image built successfully"

# Build frontend image
echo "📦 Building frontend image..."
cd ../frontend
echo "⚠️  Note: Building with default backend URL. For production, use:"
echo "   docker build --build-arg VITE_BACKEND_URL=https://your-backend.com/api -t epub-reader-frontend:latest ."
docker build -t epub-reader-frontend:latest .
echo "✅ Frontend image built successfully"

cd ..

echo "🎉 All images built successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create volumes: docker volume create epub-uploads && docker volume create epub-config"
echo "2. Deploy backend with your environment variables"
echo "3. Deploy frontend with BACKEND_URL pointing to your backend"
echo ""
echo "📖 See deployment.md for detailed deployment instructions"
