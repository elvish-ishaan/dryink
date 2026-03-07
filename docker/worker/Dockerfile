# Build stage
FROM node:22-bookworm-slim AS builder

# ca-certificates needed for Puppeteer's Chromium download
RUN apt-get update && apt-get install -y \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Mirror the repo layout so relative imports resolve correctly:
# worker/src/configs/prismaclient.ts imports '../../../db/dist/index.js'

# --- Build db package first ---
WORKDIR /repo/db

COPY db/package*.json ./
RUN npm ci

COPY db/prisma ./prisma
RUN npx prisma generate

COPY db/tsconfig.json ./
COPY db/src ./src
RUN npm run build

# --- Build worker package ---
WORKDIR /repo/worker

COPY worker/package*.json ./
# Download Chromium into builder cache (~/.cache/puppeteer)
RUN npm ci

COPY worker/tsconfig.json ./
COPY worker/src ./src
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

# Chromium runtime dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc-s1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# --- db prod deps + generated Prisma client ---
WORKDIR /repo/db

COPY db/package*.json ./
RUN npm ci --omit=dev

COPY db/prisma ./prisma
COPY --from=builder /repo/db/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/db/dist ./dist

# --- worker prod deps ---
WORKDIR /repo/worker

COPY worker/package*.json ./
# Skip Chromium download — we copy it from builder below
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --omit=dev

# Copy Puppeteer's downloaded Chromium from builder
COPY --from=builder /root/.cache/puppeteer /root/.cache/puppeteer

COPY --from=builder /repo/worker/dist ./dist

CMD ["node", "dist/index.js"]
