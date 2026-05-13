FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace packages
COPY saas/apps/api ./saas/apps/api
COPY saas/apps/web ./saas/apps/web
COPY saas/packages ./saas/packages

# Install dependencies
RUN npm install

# Build all workspaces
RUN npm run build

# Expose both ports
EXPOSE 3000 4000

# Start both services
CMD ["npm", "run", "dev"]
