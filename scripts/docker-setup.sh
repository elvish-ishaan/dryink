#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log()   { echo -e "${GREEN}[setup]${NC} $1"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $1"; }
error() { echo -e "${RED}[error]${NC} $1"; exit 1; }
step()  { echo -e "\n${BLUE}==>${NC} $1"; }

# ─── Prerequisites ────────────────────────────────────────────────────────────

step "Checking prerequisites..."

command -v docker &>/dev/null || error "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
command -v node   &>/dev/null || error "Node.js is not installed. Install it from https://nodejs.org/"
command -v npm    &>/dev/null || error "npm is not installed."

log "docker $(docker --version | awk '{print $3}' | tr -d ',')"
log "node   $(node --version)"
log "npm    $(npm --version)"

# ─── .env files ───────────────────────────────────────────────────────────────

step "Setting up .env files..."

for dir in be worker; do
  env_file="$ROOT_DIR/$dir/.env"
  example_file="$ROOT_DIR/$dir/.env.example"
  if [ ! -f "$env_file" ]; then
    if [ -f "$example_file" ]; then
      cp "$example_file" "$env_file"
      warn "$dir/.env created from .env.example — fill in your actual values before starting services."
    else
      warn "No .env.example found in $dir/. Skipping."
    fi
  else
    log "$dir/.env already exists. Skipping."
  fi
done

# ─── Docker ───────────────────────────────────────────────────────────────────

step "Starting Docker services (Postgres + Redis)..."

cd "$ROOT_DIR"
docker compose up -d

log "Waiting for Postgres to be ready..."
RETRIES=20
until docker exec dryink-postgres pg_isready -U postgres &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    error "Postgres did not become ready in time. Check: docker logs dryink-postgres"
  fi
  sleep 3
done
log "Postgres is ready."

# ─── DB: install deps + migrate ───────────────────────────────────────────────

step "Setting up db package..."

cd "$ROOT_DIR/db"
log "Installing dependencies..."
npm install

log "Running Prisma migrations..."
npx prisma migrate dev --name init

# ─── BE: install deps + generate client ───────────────────────────────────────

step "Setting up be package..."

cd "$ROOT_DIR/be"
log "Installing dependencies..."
npm install

log "Generating Prisma client..."
npx prisma generate --schema=../db/prisma/schema.prisma

# ─── Worker: install deps + generate client ───────────────────────────────────

step "Setting up worker package..."

cd "$ROOT_DIR/worker"
log "Installing dependencies..."
npm install

log "Generating Prisma client..."
npx prisma generate --schema=../db/prisma/schema.prisma

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}Setup complete!${NC} Next steps:"
echo "  1. Fill in any missing values in be/.env and worker/.env"
echo "  2. Start the backend:  cd be && npm run dev"
echo "  3. Start the worker:   cd worker && npm run dev"
echo "  4. Start the frontend: cd fe && npm run dev"
