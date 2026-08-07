# Stage 1: Build
FROM node:20-slim AS builder

# Install only essential build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/socket-server.js ./socket-server.js
COPY --from=builder /app/placeiq.db ./placeiq.db

# Create uploads directory
RUN mkdir -p public/uploads/resumes

# Set environment variables
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh\nnode socket-server.js &\nnpm start' > /app/start.sh && chmod +x /app/start.sh

# Start application
CMD ["/app/start.sh"]
