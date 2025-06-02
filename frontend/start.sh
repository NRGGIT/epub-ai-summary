#!/bin/sh

# Set default backend URL if not provided
export BACKEND_URL=${BACKEND_URL:-"http://localhost:3001"}

# Ensure BACKEND_URL ends with /api
if [ "${BACKEND_URL}" != "${BACKEND_URL%/api}" ]; then
    # Already ends with /api, use as is
    BACKEND_API_URL="${BACKEND_URL}"
else
    # Add /api to the end
    BACKEND_API_URL="${BACKEND_URL}/api"
fi

echo "Using backend URL: ${BACKEND_API_URL}"

# Replace environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Replace BACKEND_URL in the template with the API URL
sed -i "s|\$BACKEND_URL|${BACKEND_API_URL}|g" /etc/nginx/conf.d/default.conf

# Start nginx
nginx -g "daemon off;"
