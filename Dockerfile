FROM node:20-alpine AS base

WORKDIR /app

# Copy monorepo root configuration
COPY package.json package-lock.json tsconfig.base.json ./

# Copy workspace source directories
COPY saas ./saas

# Install dependencies for all workspaces
RUN npm ci

# Build API service
FROM base AS api-builder
RUN npm run build --workspace @hireos/api

# Build Web service
FROM base AS web-builder  
RUN npm run build --workspace @hireos/web

# Production - API
FROM node:20-alpine AS api-prod
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY saas ./saas
COPY --from=api-builder /app/saas/apps/api/dist ./saas/apps/api/dist
COPY --from=api-builder /app/saas/apps/api/node_modules ./saas/apps/api/node_modules
COPY --from=api-builder /app/node_modules ./node_modules

EXPOSE 4000
ENV NODE_ENV=production
WORKDIR /app/saas/apps/api
CMD ["node", "dist/main.js"]

# Production - Web
FROM node:20-alpine AS web-prod
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY saas ./saas
COPY --from=web-builder /app/saas/apps/web/.next ./saas/apps/web/.next
COPY --from=web-builder /app/saas/apps/web/node_modules ./saas/apps/web/node_modules
COPY --from=web-builder /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app/saas/apps/web
CMD ["npm", "start"]
