FROM node:22-alpine AS builder

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-minout 20000 && \
    npm config set fetch-retry-maxout 120000

# Copy shared package files
COPY shared/package*.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/index.ts ./shared/
COPY shared/common ./shared/common
COPY shared/config ./shared/config
COPY shared/dtos ./shared/dtos
COPY shared/types ./shared/types

# Install shared dependencies and build
WORKDIR /app/shared
RUN (npm ci --no-audit --no-fund 2>/dev/null) || npm install --no-audit --no-fund
RUN npm run build

# Pack shared package
RUN npm pack
RUN mv furnimart-shared-1.0.0.tgz ../shared.tgz

# Setup category-service
WORKDIR /app
COPY services/category-service/package*.json ./
RUN (npm ci --no-audit --no-fund 2>/dev/null) || npm install --no-audit --no-fund

# Install packed shared package
RUN npm install ./shared.tgz --no-save

# Copy category-service source
COPY services/category-service ./

# Copy shared dist to match tsconfig path alias
RUN mkdir -p /shared && cp -r /app/shared/dist /shared/dist

# Build category-service
RUN npm run build

FROM node:22-alpine

WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-minout 20000 && \
    npm config set fetch-retry-maxout 120000

# Copy package files
COPY services/category-service/package*.json ./

# Install production dependencies
RUN for i in 1 2 3 4 5; do \
      npm ci --omit=dev --no-audit --no-fund && break || \
      (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); \
    done

# Copy and install shared package
COPY --from=builder /app/shared.tgz ./
RUN npm install ./shared.tgz --no-save

# Create symlink for shared dist
RUN mkdir -p /shared && ln -s /app/node_modules/@furnimart/shared/dist /shared/dist

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3013

CMD ["node", "dist/main.js"]
