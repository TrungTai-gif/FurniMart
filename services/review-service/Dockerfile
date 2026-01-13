FROM node:22-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy shared package files
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/index.ts ./shared/
COPY shared/common ./shared/common
COPY shared/config ./shared/config
COPY shared/dtos ./shared/dtos
COPY shared/types ./shared/types

