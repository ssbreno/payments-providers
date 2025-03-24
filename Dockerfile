# Main API Dockerfile
FROM node:20-alpine AS development

WORKDIR /app

# Copy package.json and install dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the API port
EXPOSE 3000

# Development command - use start:dev for hot reloading
CMD ["npm", "run", "start:dev"]

# Production build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma client first
RUN npx prisma generate

COPY . .

# Build after Prisma client is generated
RUN npm run build

# Production stage
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy only necessary files from the build stage
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Expose the API port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]