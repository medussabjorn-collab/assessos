# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars must be present at BUILD time — Next.js statically
# inlines them into the client bundle during `next build`. Railway only
# injects dashboard-set Variables as container runtime env by default; ARG
# here opts these specific ones into Railway's build-arg passthrough
# (Railway auto-forwards any service Variable whose name matches a declared
# ARG). Without this, setting NEXT_PUBLIC_CONTACT_ENDPOINT etc. in the dashboard
# silently has no effect on the deployed bundle.
ARG NEXT_PUBLIC_CONTACT_ENDPOINT
ARG NEXT_PUBLIC_APP_LOGIN_URL
ARG NEXT_PUBLIC_REGISTRATION_ENDPOINT
ENV NEXT_PUBLIC_CONTACT_ENDPOINT=$NEXT_PUBLIC_CONTACT_ENDPOINT
ENV NEXT_PUBLIC_APP_LOGIN_URL=$NEXT_PUBLIC_APP_LOGIN_URL
ENV NEXT_PUBLIC_REGISTRATION_ENDPOINT=$NEXT_PUBLIC_REGISTRATION_ENDPOINT

# Cache-buster: Railway's builder can reuse cached layers for COPY . . /
# npm run build even when earlier Dockerfile content changed.
# RAILWAY_GIT_COMMIT_SHA changes on every push, so referencing it here
# forces Docker to treat every subsequent layer as new.
ARG RAILWAY_GIT_COMMIT_SHA
RUN echo "Building commit ${RAILWAY_GIT_COMMIT_SHA}"

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Shell-level `PORT=3001 node server.js` is not reliable — Railway's
# platform can still deliver its own injected PORT to the running process
# regardless (a confirmed gotcha in this workspace's other Railway deploys).
# Force it at the JS runtime level instead: start.js overwrites
# process.env before requiring the real server, which wins no matter what
# the process's inherited/platform environment contains.
COPY --from=builder /app/start.js ./start.js

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "start.js"]
