FROM node:22-alpine AS builder
WORKDIR /app
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV PORT=3001
ENV DIST_DIR=/app/dist
ENV WORKSPACE_DIR=/data/workspaces
ENV MEMORY_DB_PATH=/data/memory-db
EXPOSE 3001
CMD ["node", "dist-server/server/standalone.js"]
