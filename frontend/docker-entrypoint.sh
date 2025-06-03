#!/bin/sh

# Docker entrypoint script for injecting environment variables at runtime

# Default values
VITE_API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:3000/api"}

# Create a temporary config file with environment variables
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF

# Extract backend URL from VITE_API_BASE_URL by removing /api suffix
BACKEND_URL_FOR_NGINX=$(echo "$VITE_API_BASE_URL" | sed 's|/api$||')

echo "Environment variables injected:"
echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"
echo "BACKEND_URL_FOR_NGINX: ${BACKEND_URL_FOR_NGINX}"

# Execute the original command, passing backend URL as an environment variable for Nginx
exec env ENV_BACKEND_URL=$BACKEND_URL_FOR_NGINX "$@"
