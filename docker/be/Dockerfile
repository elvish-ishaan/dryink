# Build stage
FROM node:22-bookworm-slim AS builder

# Mirror the repo layout so relative imports resolve correctly:
# be/src/client/prismaClient.ts imports '../../../db/dist/index.js'

# --- Build db package first ---
WORKDIR /repo/db

COPY db/package*.json ./
RUN npm ci

COPY db/prisma ./prisma
RUN npx prisma generate

COPY db/tsconfig.json ./
COPY db/src ./src
RUN npm run build

# --- Build be package ---
WORKDIR /repo/be

COPY be/package*.json ./
RUN npm ci

COPY be/tsconfig.json ./
COPY be/src ./src
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

# --- db prod deps + generated Prisma client ---
WORKDIR /repo/db

COPY db/package*.json ./
RUN npm ci --omit=dev

COPY db/prisma ./prisma
# Copy generated .prisma/client from builder (avoids needing prisma CLI here)
COPY --from=builder /repo/db/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/db/dist ./dist

# --- be prod deps ---
WORKDIR /repo/be

COPY be/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /repo/be/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
