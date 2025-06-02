# EPUB Reader with AI Summarization - Deployment Guide

## 📋 Overview

This guide provides instructions for deploying the EPUB Reader application using Docker containers. The application consists of two separate services: a Node.js backend and a Vue.js frontend served by nginx.

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS/443    ┌─────────────────┐
│   Frontend      │◄──────────────►│   Load Balancer │
│   (nginx)       │                │   /Reverse Proxy│
│   Port 80       │                └─────────────────┘
└─────────────────┘                          │
         │                                   │
         │ API Proxy                         │ HTTPS
         ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│   Backend       │                │   External      │
│   (Node.js)     │                │   Users         │
│   Port 3001     │                └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Persistent    │
│   Storage       │
│   (Volumes)     │
└─────────────────┘
```

## 🚀 Deployment Instructions

### Prerequisites

- Docker runtime environment
- HTTPS-capable load balancer or reverse proxy
- Persistent storage for volumes
- OpenAI API key (or compatible API endpoint)

### 1. Backend Service Deployment

#### Build Backend Image
```bash
cd backend
docker build -t epub-reader-backend:latest .
```

#### Deploy Backend Container
```bash
docker run -d \
  --name epub-reader-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -v epub-uploads:/app/uploads \
  -v epub-config:/app/data \
  -e OPENAI_API_KEY="your_openai_api_key" \
  -e OPENAI_API_ENDPOINT="https://api.openai.com/v1" \
  -e OPENAI_MODEL_NAME="gpt-4" \
  -e DEFAULT_RATIO="0.3" \
  epub-reader-backend:latest
```

### 2. Frontend Service Deployment

#### Build Frontend Image
```bash
cd frontend
docker build -t epub-reader-frontend:latest .
```

#### Deploy Frontend Container
```bash
docker run -d \
  --name epub-reader-frontend \
  --restart unless-stopped \
  -p 80:80 \
  -e BACKEND_URL="https://your-backend-domain.com" \
  epub-reader-frontend:latest
```

## 📦 Required Volumes

### Backend Volumes

| Volume Name | Container Path | Purpose | Recommended Size |
|-------------|----------------|---------|------------------|
| `epub-uploads` | `/app/uploads` | EPUB file storage and extracted content | 10-50 GB |
| `epub-config` | `/app/data` | Configuration files and application data | 1 GB |

### Volume Creation Commands
```bash
# Create backend volumes
docker volume create epub-uploads
docker volume create epub-config
```

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Backend server port |
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key for AI summarization |
| `OPENAI_API_ENDPOINT` | No | `https://api.openai.com/v1` | OpenAI API endpoint URL |
| `OPENAI_MODEL_NAME` | No | `gpt-4` | OpenAI model to use for summarization |
| `OPENAI_PROMPT` | No | Default prompt | Custom prompt for AI summarization |
| `DEFAULT_RATIO` | No | `0.3` | Default compression ratio (0.1-0.8) |

*Required unless using config.json file

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_URL` | Yes | `http://localhost:3001` | Backend service URL (without /api suffix) |

## 🔌 Port Configuration

### Backend Service
- **Internal Port**: 3001
- **Protocol**: HTTP
- **Health Check**: `GET /api/health`

### Frontend Service
- **Internal Port**: 80
- **Protocol**: HTTP
- **Health Check**: `GET /health`

### Load Balancer Configuration
- **Frontend**: Route all web traffic to frontend service port 80
- **API Proxy**: Frontend nginx automatically proxies `/api/*` requests to backend
- **HTTPS**: Configure SSL termination at load balancer level
- **Only HTTPS**: Ensure all external traffic uses HTTPS (port 443)

## 💾 Hardware Requirements

### Minimum Requirements

#### Backend Service
- **CPU**: 1 vCPU
- **Memory**: 1 GB RAM
- **Storage**: 20 GB (10 GB for uploads + 10 GB for system)
- **Network**: 100 Mbps

#### Frontend Service
- **CPU**: 0.5 vCPU
- **Memory**: 512 MB RAM
- **Storage**: 5 GB
- **Network**: 100 Mbps

### Recommended Requirements

#### Backend Service
- **CPU**: 2 vCPU
- **Memory**: 4 GB RAM
- **Storage**: 100 GB SSD (50 GB for uploads + 50 GB for system)
- **Network**: 1 Gbps

#### Frontend Service
- **CPU**: 1 vCPU
- **Memory**: 1 GB RAM
- **Storage**: 10 GB SSD
- **Network**: 1 Gbps

### Scaling Considerations
- **Backend**: CPU-intensive during EPUB processing and AI summarization
- **Storage**: Grows with number of uploaded EPUB files
- **Memory**: Increases with concurrent AI summarization requests
- **Network**: High bandwidth needed for large EPUB file uploads

## 🔒 Security Considerations

### Network Security
- Backend service should not be directly accessible from internet
- Use internal networking between frontend and backend
- Configure firewall rules to restrict access

### Data Security
- Secure OpenAI API key storage (use secrets management)
- Regular backup of volumes
- Monitor for unauthorized access

### SSL/TLS
- HTTPS required for all external traffic
- Configure proper SSL certificates
- Use strong cipher suites

## 🔍 Health Checks

### Backend Health Check
```bash
curl -f http://backend-host:3001/api/health
```

### Frontend Health Check
```bash
curl -f http://frontend-host/health
```

## 📊 Monitoring

### Key Metrics to Monitor
- Container CPU and memory usage
- Disk space usage for volumes
- API response times
- Error rates
- Upload success rates

### Log Locations
- **Backend**: Container stdout/stderr
- **Frontend**: nginx access and error logs
- **Application**: Backend application logs

## 🔄 Backup Strategy

### Critical Data
- **EPUB Files**: `/app/uploads` volume
- **Configuration**: `/app/data` volume

### Backup Commands
```bash
# Backup uploads volume
docker run --rm -v epub-uploads:/data -v $(pwd):/backup alpine tar czf /backup/epub-uploads-$(date +%Y%m%d).tar.gz -C /data .

# Backup config volume
docker run --rm -v epub-config:/data -v $(pwd):/backup alpine tar czf /backup/epub-config-$(date +%Y%m%d).tar.gz -C /data .
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check OpenAI API key configuration
- Verify volume permissions
- Check available disk space

#### Frontend Can't Connect to Backend
- Verify BACKEND_URL environment variable
- Check network connectivity between containers
- Verify backend health endpoint

#### Upload Failures
- Check disk space in uploads volume
- Verify file permissions
- Check backend logs for errors

### Debug Commands
```bash
# Check container logs
docker logs epub-reader-backend
docker logs epub-reader-frontend

# Access container shell
docker exec -it epub-reader-backend sh
docker exec -it epub-reader-frontend sh

# Check volume contents
docker run --rm -v epub-uploads:/data alpine ls -la /data
```

## 🔄 Updates and Maintenance

### Updating Services
1. Build new image with updated code
2. Stop existing container
3. Start new container with same volumes and environment variables
4. Verify health checks pass

### Maintenance Tasks
- Regular volume backups
- Monitor disk usage
- Update base images for security patches
- Review and rotate API keys

## 📝 Configuration Notes

### Environment Variable Priority
Backend configuration follows this priority order:
1. Environment variables (highest priority)
2. config.json file
3. Default values (lowest priority)

### Frontend-Backend Connection
- Frontend uses BACKEND_URL environment variable to connect to backend
- nginx automatically proxies `/api/*` requests to the backend service
- No direct frontend-to-backend networking required if using proxy

This deployment guide ensures a secure, scalable, and maintainable deployment of the EPUB Reader application with proper separation of concerns and production-ready configuration.
