# Use Node.js LTS version as base image
FROM node:25-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy source code (needed before npm ci since prepare script runs build)
COPY src ./src

# Install dependencies and build
RUN npm ci && npm cache clean --force

# Remove source files to reduce image size
RUN rm -rf src tsconfig.json

# Set environment variables (these should be overridden at runtime)
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
