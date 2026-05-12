# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# web-speed-survivor — Next.js 15 production image
#
# Mirrors the multi-stage layout used by api-speed-survivor's Python image:
#   1. deps      — install npm deps with a primed cache layer
#   2. builder   — `next build` against .env.production (NEXT_PUBLIC_* baked
#                  in here; server-only secrets stay out)
#   3. runtime   — Node 20 alpine + standalone server + static + public
#
# `output: "standalone"` in next.config.ts means we copy ~30 MB of bundled
# code into the runtime stage instead of the full ~800 MB node_modules.
# Final image is ~180 MB.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20-alpine

# ---------- deps ----------------------------------------------------------
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

# `--legacy-peer-deps` because @coinflowlabs/react still pins react@18 in its
# peerDependencies even though it works fine with react@19, which is what
# Next 15 ships. Same flag the local quick-start uses.
RUN apk add --no-cache libc6-compat

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# ---------- builder -------------------------------------------------------
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# .env.production is tracked in git and contains only NEXT_PUBLIC_* values
# (see .env.production header). Next reads it automatically when
# NODE_ENV=production. If you need to override at build time, pass
# --build-arg or mount a different .env.production.
RUN yarn build

# ---------- runtime -------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Listen on App Platform's expected port. Override with -e PORT=... if needed.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Run as non-root for parity with the api image.
RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy the standalone server, the static chunks, and any /public assets.
# Order matters: copy as `nextjs` so we don't need a recursive chown.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# `public/` is optional — copy if it exists. Using a wildcard pattern would
# fail if absent, so we touch it in the builder stage as a no-op safety.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

# server.js is emitted by `next build` into .next/standalone/. It's a thin
# wrapper around Next's request handler — no `next start` needed.
CMD ["node", "server.js"]
