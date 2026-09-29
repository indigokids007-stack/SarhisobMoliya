# Multi-stage Dockerfile for Daily Expense Manager (Cloud Run)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies for building
RUN npm install

# Copy source code
COPY . .

# Build frontend production bundle (Vite)
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=builder /app/public ./public

# Cloud Run dynamic port
EXPOSE 8080

# Start production server
CMD ["node", "server.ts"]
