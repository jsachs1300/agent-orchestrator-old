# Build the Vite app
FROM node:20-slim AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY . .

# Build-time API target for the frontend
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build with increased memory limit for Node
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Serve the static bundle with nginx
FROM nginx:1.27-alpine

# Cloud Run expects the container to listen on $PORT (default 8080)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Add healthcheck endpoint
RUN echo '<!DOCTYPE html><html><body>OK</body></html>' > /usr/share/nginx/html/health

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
