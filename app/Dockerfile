# ---- Stage 1: Build/Install Dependencies ----
FROM node:22-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Environment configuration
ENV NODE_ENV=development
ENV PORT=9000

# The port your Express app listens on
EXPOSE 9000

# Default command to run your Express server
CMD ["node", "server.js"]