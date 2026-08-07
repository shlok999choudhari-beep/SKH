#!/bin/bash

set -e

# Configuration
IMAGE_NAME="placeiq"
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
TAG="${TAG:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "🔨 Building Docker image: ${FULL_IMAGE_NAME}"
docker build -t ${FULL_IMAGE_NAME} .

echo "✅ Image built successfully!"
echo "📦 Image details:"
docker images ${FULL_IMAGE_NAME}

echo "🔐 Logging into Docker Hub..."
docker login

echo "🚀 Pushing image to Docker Hub: ${FULL_IMAGE_NAME}"
docker push ${FULL_IMAGE_NAME}

echo "✅ Successfully pushed ${FULL_IMAGE_NAME} to Docker Hub!"
echo "📝 To pull this image, use: docker pull ${FULL_IMAGE_NAME}"
