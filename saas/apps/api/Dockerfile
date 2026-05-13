FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy API workspace
COPY saas/apps/api ./saas/apps/api
COPY saas/packages ./saas/packages

# Install dependencies
RUN npm install --workspace @hireos/api

# Build API
WORKDIR /app/saas/apps/api
RUN npm run build

# Expose API port
EXPOSE 4000

# Start API
CMD ["npm", "start"]
