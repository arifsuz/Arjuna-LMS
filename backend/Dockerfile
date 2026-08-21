# ─── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build dependencies for native modules (e.g. argon2/node-gyp) & Prisma
RUN apk add --no-cache python3 make g++ libc6-compat openssl

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
COPY prisma.config.ts ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ─── Stage 2: Production Runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install runtime dependencies for Prisma and native libraries
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000

# Start backend with auto migration on start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
