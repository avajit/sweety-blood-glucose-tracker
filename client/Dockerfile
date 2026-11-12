# Stage 1: Build React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests for layer caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install build dependencies
RUN npm ci

# Copy shared library and client source
COPY shared/ ./shared/
COPY client/ ./client/

# Build static SPA distribution
RUN npm run build -w client

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy custom Nginx configuration with /api reverse proxy
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
