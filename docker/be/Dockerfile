# Build stage
FROM node:22-bookworm-slim AS builder

# npm workspaces monorepo: build context is the repo root.
# Copy every workspace manifest first so the root lockfile resolves consistently,
# then scope the actual install to just @dryink/be and its @dryink/db dependency.
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
COPY apps/be/package.json apps/be/package.json
COPY apps/fe/package.json apps/fe/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN npm ci --workspace=@dryink/db --workspace=@dryink/be --include-workspace-root

# --- Build db first: be imports @dryink/db's compiled dist/ output ---
COPY packages/db/tsconfig.json packages/db/tsconfig.json
COPY packages/db/src packages/db/src
RUN npm run build --workspace=@dryink/db

# --- Build be ---
COPY apps/be/tsconfig.json apps/be/tsconfig.json
COPY apps/be/src apps/be/src
RUN npm run build --workspace=@dryink/be

# Production stage
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
COPY apps/be/package.json apps/be/package.json
COPY apps/fe/package.json apps/fe/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN npm ci --workspace=@dryink/db --workspace=@dryink/be --include-workspace-root --omit=dev

# --- Generated Prisma client + compiled output, copied from builder ---
# (db's postinstall can't regenerate here since the prisma CLI is a devDependency
# and is omitted above; the already-generated client from the builder is used instead.)
COPY --from=builder /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/packages/db/dist ./packages/db/dist
COPY --from=builder /repo/apps/be/dist ./apps/be/dist

WORKDIR /repo/apps/be

EXPOSE 5000

CMD ["node", "dist/index.js"]
