FROM node:20-slim

WORKDIR /app

# Copy db folder and build it first
COPY db/package*.json ./db/
COPY db/prisma ./db/prisma
COPY db/tsconfig.json ./db/
COPY db/src ./db/src

WORKDIR /app/db
RUN npm install
RUN npx prisma generate
RUN npm run build

# Now handle worker
WORKDIR /app/worker

# Copy worker package files
COPY worker/package*.json ./

# Install worker dependencies
RUN npm install

# Copy worker source
COPY worker/ ./

# Build worker (now db/dist/index.js exists)
RUN npm run build

EXPOSE 8081

CMD ["npm", "run", "start"]