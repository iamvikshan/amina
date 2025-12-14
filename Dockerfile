# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:alpine AS dependencies

WORKDIR /app

# Copy package files for better caching
COPY package.json bun.lock ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy package files for dev dependencies and caching
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy application source + build config
COPY app/ ./app/
COPY public/ ./public/
COPY types/ ./types/
COPY postcss.config.mts ./
COPY tsconfig.json ./
COPY vite.config.mts ./

# Build the application
RUN bun run build

# ============================================
# Stage 3: Final Runtime Image
# ============================================
FROM oven/bun:alpine AS runtime

# Create non-root user
RUN adduser -D -u 1001 amina

WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=amina:amina /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=amina:amina /app/dist ./dist
COPY --from=builder --chown=amina:amina /app/public ./public

USER amina

# Set environment variables
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321

EXPOSE 4321

CMD ["bun", "dist/index.js"]
