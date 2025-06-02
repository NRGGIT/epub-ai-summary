#!/bin/sh

# Use VITE_BACKEND_URL if provided, otherwise default to localhost
# VITE_BACKEND_URL should include /api path, but we need base URL for nginx
if [ -n "$VITE_BACKEND_URL" ]; then
    # Remove /api suffix if present to get base URL for nginx
    export BACKEND_BASE_URL=${VITE_BACKEND_URL%/api}
else
    export BACKEND_BASE_URL="http://localhost:3001"
fi

echo "Using backend base URL: ${BACKEND_BASE_URL}"

# Copy nginx config template and replace the backend URL
cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

# Replace BACKEND_URL placeholder with base URL
sed -i "s|\$BACKEND_URL|${BACKEND_BASE_URL}|g" /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"
