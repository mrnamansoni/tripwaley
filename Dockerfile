# ---------------------------------------------------------------------------
# Tripwaley — production image (multi-stage, Next.js standalone output)
# Works out of the box on Dokploy / any Docker host. ~150MB final image.
# ---------------------------------------------------------------------------

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone server + static assets + public images (owned by the app user)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# writable runtime dirs for the file-based CMS: the admin panel saves catalog/
# reviews/bookings JSON to /app/data and uploads photos to /app/public/uploads.
# Mount persistent volumes here in Dokploy — an empty named volume inherits this
# ownership, so the unprivileged user can write and the data survives redeploys.
RUN mkdir -p /app/data /app/public/uploads && chown -R nextjs:nodejs /app/data /app/public/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
