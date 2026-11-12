# Multi-stage Dockerfile for Sweety API Server
FROM node:22-alpine AS base

# Install openssl for Prisma on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root manifest and workspaces manifests for optimal Docker layer caching
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies (including Prisma)
RUN npm ci

# Copy shared library code
COPY shared/ ./shared/

# Copy server code and Prisma schema
COPY server/ ./server/

# Generate Prisma Client
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Set entrypoint script permissions and app ownership
RUN chmod +x ./server/docker-entrypoint.sh && chown -R node:node /app

# Environment and networking
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Use non-root node user for container security
USER node

ENTRYPOINT ["./server/docker-entrypoint.sh"]
CMD ["node", "server/src/server.js"]
