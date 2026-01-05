FROM node:20-alpine AS builder

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
COPY shared/types ./shared/types

# Install shared dependencies and build
WORKDIR /app/shared
RUN (npm ci --no-audit --no-fund 2>/dev/null) || npm install --no-audit --no-fund
RUN npm run build

# Pack shared package
RUN npm pack
RUN mv furnimart-shared-1.0.0.tgz ../shared.tgz

# Setup chat-service
WORKDIR /app
COPY services/chat-service/package*.json ./
RUN (npm ci --no-audit --no-fund 2>/dev/null) || npm install --no-audit --no-fund

# Install packed shared package
RUN npm install ./shared.tgz --no-save

# Copy chat-service source
COPY services/chat-service ./

# Copy shared dist to match tsconfig path alias (../../shared/dist from service perspective)
# From /app, ../../shared/dist = /shared/dist
RUN mkdir -p /shared && cp -r /app/shared/dist /shared/dist

# Build chat-service
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY services/chat-service/package*.json ./

# Install production dependencies
RUN for i in 1 2 3 4 5; do \
      npm ci --omit=dev --no-audit --no-fund && break || \
      (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); \
    done

# Copy and install shared package (with dependencies)
COPY --from=builder /app/shared.tgz ./
RUN npm install ./shared.tgz --no-save

# Create symlink for shared dist (code compiled with ../../shared/dist path)
RUN mkdir -p /shared && ln -s /app/node_modules/@furnimart/shared/dist /shared/dist

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3008

CMD ["node", "dist/main.js"]
