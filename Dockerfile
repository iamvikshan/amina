FROM alpine:latest

# Install Bun and dependencies
RUN apk add --no-cache \
    curl \
    unzip \
    bash \
    dumb-init \
    ca-certificates \
    libstdc++ \
    libgcc \
    && adduser -D -u 1001 amina \
    && curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.1" \
    && mv /root/.bun /home/amina/.bun \
    && chown -R amina:amina /home/amina/.bun \
    && ln -s /home/amina/.bun/bin/bun /usr/local/bin/bun \
    && apk del unzip bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY types/ ./types/

# Create logs directory and set ownership
RUN mkdir -p /app/logs && chown -R amina:amina /app

USER amina

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "src/index.js"]