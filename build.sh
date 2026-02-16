#!/bin/bash

# Remove old files
rm -rf node_modules prisma/client dist

# Pull latest changes
git pull origin

# Install and build
npm install
npx prisma generate
npm run build

# Run the application
npm run start:prod