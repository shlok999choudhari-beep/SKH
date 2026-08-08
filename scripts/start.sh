#!/bin/bash

# Start socket server in background
node server/socket-server.js &

# Start Next.js server
npm start
