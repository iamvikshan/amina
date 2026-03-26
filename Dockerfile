# ============================================
# Stage 1: Dependencies (alpine -- package manager for install)
# ============================================
FROM oven/bun:alpine AS deps

WORKDIR /app

COPY bun.lock package.json ./
COPY api/package.json ./api/
COPY cli/package.json ./cli/

RUN bun install --frozen-lockfile --production --ignore-scripts --filter 'amina'

# Pre-create logs dir owned by distroless nonroot (UID 65532)
RUN mkdir -p /app/logs && chown 65532:65532 /app/logs

# ============================================
# Stage 2: Development (alpine -- shell for dev tooling)
# ============================================
FROM oven/bun:alpine AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

RUN mkdir -p /app/logs

EXPOSE 3000

CMD ["bun", "--watch", "src/index.ts"]

# ============================================
# Stage 3: Production (distroless -- minimal attack surface)
# ============================================
FROM oven/bun:distroless AS production

WORKDIR /app

COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=deps --chown=nonroot:nonroot /app/package.json ./package.json
COPY --from=deps --chown=nonroot:nonroot /app/logs ./logs/
COPY --chown=nonroot:nonroot src/ ./src/
COPY --chown=nonroot:nonroot types/ ./types/
COPY --chown=nonroot:nonroot tsconfig.json ./

USER nonroot

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["bun", "run", "src/services/health.ts"]

CMD ["bun", "run", "src/index.ts"]
