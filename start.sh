#!/bin/bash

# Start socket server in background
node socket-server.js &

# Start Next.js server
npm start
