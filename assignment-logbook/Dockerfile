# ════════════════════════════════════════════════════════════════
#  Claude Assignment Log Book — Next.js 14 Docker Image
#  Multi-stage build: deps → builder → runner
#  Week 10 — Containerisation Assignment
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Install dependencies ───────────────────────────────
FROM node:20-alpine AS deps

# Install compatibility layer for native binaries
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy only package files first (layer caching — only re-runs if deps change)
COPY package*.json ./

# Install production + dev dependencies needed for build
RUN npm install

# ── Stage 2: Build the Next.js application ─────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source code
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the production bundle
RUN npm run build

# ── Stage 3: Minimal production runner ─────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy built output from builder stage
COPY --from=builder /app/package*.json ./

# Standalone output mode copies only necessary files
# If using output: 'standalone' in next.config.js:
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Fall back: if not using standalone mode, copy full .next + node_modules
# (comment out the two lines above and uncomment these two)
# COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules

# Run as non-root user
USER nextjs

EXPOSE 3000

# Health check — confirms the app responds on port 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/assignments/stats || exit 1

# Start the Next.js production server
CMD ["node", "server.js"]

# ── Notes ───────────────────────────────────────────────────────
# To use CMD ["npm", "start"] instead (without standalone mode):
#   1. Remove the standalone COPY lines above
#   2. Uncomment the fallback COPY lines above
#   3. Change CMD to: CMD ["npm", "start"]
