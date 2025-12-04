FROM node:20-slim

WORKDIR /app

# Copy worker package files.
COPY worker/package*.json ./ 

# Install dependencies
RUN npm install

# Copy worker source
COPY worker .

# Copy Prisma schema from shared db folder....
COPY db/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build worker
RUN npm run build

EXPOSE 8081

CMD ["npm","run", "start"]
