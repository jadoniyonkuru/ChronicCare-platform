# ---- Build: install all dependencies, compile, then drop dev dependencies ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- Runtime: compiled code and production dependencies only ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3002

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Run as the unprivileged user that ships with the Node image.
USER node
EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

CMD ["node", "dist/main.js"]
