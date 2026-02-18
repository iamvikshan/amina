# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3.9-alpine AS dependencies

WORKDIR /app

# Copy lockfile and package files (api/package.json needed for workspace resolution)
COPY bun.lock ./
COPY package.json ./
COPY api/package.json ./api/

# Install production dependencies only (skip api workspace)
RUN bun install --frozen-lockfile --production --ignore-scripts --filter 'amina'

# ============================================
# Stage 2: Final Runtime Image
# ============================================
FROM oven/bun:1.3.9-alpine AS runtime

# Install only dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN adduser -D -u 1001 amina

WORKDIR /app

# Copy dependencies from build stage
COPY --from=dependencies --chown=amina:amina /app/node_modules ./node_modules
COPY --from=dependencies --chown=amina:amina /app/package.json ./package.json

# Copy application code
COPY --chown=amina:amina src/ ./src/
COPY --chown=amina:amina tsconfig.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R amina:amina /app

USER amina

EXPOSE 3000

# Use wget for healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "src/index.ts"]
