# Build stage
FROM node:22-bookworm-slim AS builder

# ca-certificates needed for Puppeteer's Chromium download
RUN apt-get update && apt-get install -y \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# npm workspaces monorepo: build context is the repo root.
# Copy every workspace manifest first so the root lockfile resolves consistently,
# then scope the actual install to just @dryink/worker and its @dryink/db dependency.
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
COPY apps/worker/package.json apps/worker/package.json
COPY apps/be/package.json apps/be/package.json
COPY apps/fe/package.json apps/fe/package.json

# Downloads Chromium into the builder cache (~/.cache/puppeteer)
RUN npm ci --workspace=@dryink/db --workspace=@dryink/worker --include-workspace-root

# --- Build db first: worker imports @dryink/db's compiled dist/ output ---
COPY packages/db/tsconfig.json packages/db/tsconfig.json
COPY packages/db/src packages/db/src
RUN npm run build --workspace=@dryink/db

# --- Build worker ---
COPY apps/worker/tsconfig.json apps/worker/tsconfig.json
COPY apps/worker/src apps/worker/src
RUN npm run build --workspace=@dryink/worker

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

WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
COPY apps/worker/package.json apps/worker/package.json
COPY apps/be/package.json apps/be/package.json
COPY apps/fe/package.json apps/fe/package.json

# Skip Chromium download — we copy the builder's cached download below
# (db's postinstall can't regenerate here since the prisma CLI is a devDependency
# and is omitted below; the already-generated client from the builder is used instead.)
RUN PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --workspace=@dryink/db --workspace=@dryink/worker --include-workspace-root --omit=dev

# Copy Puppeteer's downloaded Chromium from builder
COPY --from=builder /root/.cache/puppeteer /root/.cache/puppeteer

COPY --from=builder /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/packages/db/dist ./packages/db/dist
COPY --from=builder /repo/apps/worker/dist ./apps/worker/dist

WORKDIR /repo/apps/worker

CMD ["node", "dist/index.js"]
