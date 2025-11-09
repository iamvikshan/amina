# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3.1-alpine AS dependencies

WORKDIR /app

# Copy package files for better caching
COPY package.json ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3.1-alpine AS builder

WORKDIR /app

# Copy package.json for dev dependencies
COPY package.json ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY astro.config.mjs ./
COPY tailwind.config.mjs ./
COPY process-html.mjs ./

# Build the application
RUN bun run build

# ============================================
# Stage 3: Final Runtime Image
# ============================================
FROM oven/bun:1.3.1-alpine AS runtime

# Install only dumb-init (no curl needed)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN adduser -D -u 1001 amina

WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=amina:amina /app/node_modules ./node_modules
COPY --from=dependencies --chown=amina:amina /app/package.json ./package.json

# Copy built application from builder stage
COPY --from=builder --chown=amina:amina /app/dist ./dist

# Copy configuration files needed at runtime
COPY --chown=amina:amina astro.config.mjs ./

# Create logs directory (if needed)
RUN mkdir -p /app/logs && chown -R amina:amina /app

USER amina

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

# Use wget for healthcheck (already in alpine, no additional dependency)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "dist/server/entry.mjs"]
