# syntax=docker/dockerfile:1

# ---- Builder : installe les deps (compile better-sqlite3), build SvelteKit ----
FROM node:20-slim AS builder
WORKDIR /app

# Outils de compilation pour les modules natifs (better-sqlite3, sharp)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev   # retire devDeps (drizzle-kit, sharp, vite...) ; garde better-sqlite3 + drizzle-orm compilés

# ---- Runner : image minimale de production ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Artefacts nécessaires au runtime
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.js ./scripts/migrate.js
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Migration puis démarrage du serveur Node (adapter-node)
CMD ["sh", "-c", "node scripts/migrate.js && node build"]
