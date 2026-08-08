#!/bin/bash

# Demo Docker Deployment Script
# This script builds, runs, and pushes the Docker image

set -e

echo "🚀 Demo Docker Deployment"
echo "=============================="

# Configuration
IMAGE_NAME="darshan11111/demo"
IMAGE_TAG="latest"
CONTAINER_NAME="demo-app"

# Step 1: Build Docker image
echo ""
echo "📦 Step 1: Building Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Step 2: Stop and remove existing container if running
echo ""
echo "🛑 Step 2: Stopping existing container (if any)..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# Step 3: Run the container
echo ""
echo "🏃 Step 3: Starting container..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
    echo "🌐 Application is running at: http://localhost:5000"
    echo "🔌 Socket server is running at: http://localhost:3001"
else
    echo "❌ Failed to start container"
    exit 1
fi

# Step 4: Wait for container to be healthy
echo ""
echo "⏳ Step 4: Waiting for application to be ready..."
sleep 10

# Check if container is running
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo "✅ Container is running!"
    
    # Show logs
    echo ""
    echo "📋 Container logs:"
    docker logs ${CONTAINER_NAME} --tail 20
else
    echo "❌ Container failed to start"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

# Step 5: Push to Docker Hub
echo ""
echo "📤 Step 5: Pushing image to Docker Hub..."
echo "Please make sure you're logged in to Docker Hub (docker login)"
read -p "Do you want to push the image to Docker Hub? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker push ${IMAGE_NAME}:${IMAGE_TAG}
    
    if [ $? -eq 0 ]; then
        echo "✅ Image pushed successfully to Docker Hub!"
        echo "🐳 Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    else
        echo "❌ Failed to push image to Docker Hub"
        echo "💡 Make sure you're logged in: docker login"
        exit 1
    fi
else
    echo "⏭️  Skipping Docker Hub push"
fi

# Summary
echo ""
echo "=============================="
echo "✅ Deployment Complete!"
echo "=============================="
echo ""
echo "📊 Summary:"
echo "  - Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  - Container: ${CONTAINER_NAME}"
echo "  - Web URL: http://localhost:5000"
echo "  - Socket URL: http://localhost:3001"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: docker logs ${CONTAINER_NAME} -f"
echo "  - Stop: docker-compose down"
echo "  - Restart: docker-compose restart"
echo "  - Shell access: docker exec -it ${CONTAINER_NAME} sh"
echo ""
