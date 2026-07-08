# ── Build stage ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies only
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

COPY src ./src

RUN npx prisma generate && npm run build

# ── Dependency stage (production deps only) ────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --ignore-scripts && npx prisma generate

# ── Production stage ──────────────────────────────────────
FROM node:20-alpine AS runner

# Security labels
LABEL org.opencontainers.image.title="LeaderAssess Pro API" \
      org.opencontainers.image.source="https://github.com/your-org/leaderassess-backend" \
      org.opencontainers.image.licenses="UNLICENSED"

# Harden: no root, read-only where possible
RUN addgroup -g 1001 -S nodeapp && \
    adduser  -u 1001 -S nodeapp -G nodeapp

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# Copy production deps + compiled output
COPY --from=deps    --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodeapp /app/dist         ./dist
COPY --from=builder --chown=nodeapp:nodeapp /app/prisma       ./prisma
COPY --from=deps    --chown=nodeapp:nodeapp /app/node_modules/.prisma ./node_modules/.prisma

USER nodeapp

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Run migrations then start (Prisma migrate deploy is idempotent)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
