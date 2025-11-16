# Use Node.js LTS version as base image
FROM node:25-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm install typescript @types/node --save-dev && \
    npm run build && \
    npm uninstall typescript @types/node

# Remove source files to reduce image size
RUN rm -rf src tsconfig.json

# Set environment variables (these should be overridden at runtime)
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
