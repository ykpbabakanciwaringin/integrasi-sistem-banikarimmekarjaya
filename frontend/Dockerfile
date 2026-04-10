# Tahap 1: Install Dependencies & Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --------------------------------------------------------

# Tahap 2: Runner (Production)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# [PENTING]: Buat user non-root demi keamanan server
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy hasil build dari Tahap 1 dan ubah hak akses ke user nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Gunakan user non-root yang baru dibuat
USER nextjs

# Expose port frontend
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Jalankan Next.js
CMD ["node", "server.js"]