#!/bin/sh

# Use VITE_BACKEND_URL if provided, otherwise default to localhost
# VITE_BACKEND_URL should already include /api path
export BACKEND_API_URL=${VITE_BACKEND_URL:-"http://localhost:3001/api"}

echo "Using backend URL: ${BACKEND_API_URL}"

# Replace environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Replace BACKEND_URL in the template with the API URL
sed -i "s|\$BACKEND_URL|${BACKEND_API_URL}|g" /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"
