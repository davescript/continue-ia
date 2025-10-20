# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# Cache installs
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci --prefix client \
 && npm ci --prefix server

# Copy source and build client
COPY client client
RUN npm run --prefix client build

# Copy server source
COPY server server

# Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy code and built assets
COPY --from=builder /app/client/dist client/dist
COPY --from=builder /app/server server

# Install only server production deps
RUN npm ci --omit=dev --prefix server

WORKDIR /app/server
EXPOSE 4000
CMD ["node","src/app.js"]

