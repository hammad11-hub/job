FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy Web workspace
COPY saas/apps/web ./saas/apps/web
COPY saas/packages ./saas/packages

# Install dependencies
RUN npm install --workspace @hireos/web

# Build Next.js
WORKDIR /app/saas/apps/web
RUN npm run build

# Expose web port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
