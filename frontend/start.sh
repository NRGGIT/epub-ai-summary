#!/bin/sh

# Simple startup - no proxy configuration needed
# Frontend will connect directly to backend using VITE_BACKEND_URL
echo "Frontend starting - will connect directly to backend"
if [ -n "$VITE_BACKEND_URL" ]; then
    echo "Backend URL configured: $VITE_BACKEND_URL"
else
    echo "No VITE_BACKEND_URL set - using default /api for development"
fi

# Copy nginx config (no substitution needed)
cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"
