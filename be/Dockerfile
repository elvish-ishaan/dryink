FROM node:20-slim

WORKDIR /app

# Copy backend package files
COPY be/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source.
COPY be .

# Copy Prisma schema & migrations from /db into backend prisma folder
COPY db/prisma ./prisma

# Generate Prisma client inside the container...
RUN npx prisma generate

# Build worker
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start"]
