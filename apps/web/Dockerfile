# syntax=docker/dockerfile:1

# Build context is the repository root (see docker-compose.yml) so npm workspaces resolve.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/web --include-workspace-root=false
COPY tsconfig.base.json ./
COPY apps/web apps/web
RUN npm run build --workspace apps/web

# Unprivileged variant: runs as the nginx user (uid 101), so it listens on 8080 instead of 80.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
