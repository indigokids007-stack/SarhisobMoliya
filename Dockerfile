# Multi-stage Dockerfile for Sarhisob AI

FROM oven/bun:1 AS builder

WORKDIR /app

# Dependency manifests
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build Vite client
RUN bun run build


# Production runtime stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Dependency manifests
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy build artifacts
COPY --from=builder /app/dist ./dist

# Copy server
COPY --from=builder /app/server.ts ./server.ts

# Copy Firebase configuration
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Copy public files
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
