#!/bin/bash
set -e

echo "Installing dependencies..."
npm install --include=dev

echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
