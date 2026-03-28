#!/bin/bash

# Install all dependencies
pnpm install

# Start API server in background
pnpm --filter @workspace/api-server run dev &

# Start frontend
pnpm --filter @workspace/samanyanga run dev