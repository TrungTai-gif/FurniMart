FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy shared folder first
COPY shared ./shared

# Copy package files
COPY services/payment-service/package*.json ./
RUN for i in 1 2 3 4 5; do npm install --no-audit --no-fund && break || (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); done

# Copy service source code
COPY services/payment-service ./

# Fix tsconfig.json for Docker build context
# 1. Change ../../shared/* to shared/* since we're in /app and shared is at /app/shared
# 2. Remove rootDir restriction to allow shared files outside src
RUN node -e " \
    const fs = require('fs'); \
    const config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')); \
    config.compilerOptions.paths['@shared/*'] = ['shared/*']; \
    delete config.compilerOptions.rootDir; \
    fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2)); \
    "

RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy shared folder (needed for runtime if any shared code is used)
COPY shared ./shared

COPY services/payment-service/package*.json ./
RUN for i in 1 2 3 4 5; do npm install --production --no-audit --no-fund && break || (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); done

COPY --from=builder /app/dist ./dist

EXPOSE 3015

CMD ["node", "dist/src/main.js"]

