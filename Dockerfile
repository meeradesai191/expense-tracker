# ── Stage 1: install dependencies ──────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# ── Stage 2: final runtime image ───────────────────────────────────
FROM node:18-alpine

# Build metadata — passed in by the CI/CD pipeline (see .github/workflows/ci.yml)
# so the running app always knows exactly which commit and build it is.
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NODE_ENV=production

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

CMD ["node", "src/app.js"]
