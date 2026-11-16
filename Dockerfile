# Vaultora — Production Dockerfile
# Multi-stage build: build frontend → serve via nginx

# =============================================================================
# Stage 1: Build the static assets
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better cache)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Serve with nginx (Alpine, minimal, secure)
# =============================================================================
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root user (nginx user exists in alpine image)
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]