# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/pos-web/package.json ./apps/pos-web/

RUN pnpm install --frozen-lockfile --filter @hizlipos/pos-web

COPY apps/pos-web ./apps/pos-web

WORKDIR /app/apps/pos-web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN

RUN pnpm run build

# ─── Stage 2: Production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/apps/pos-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/pos-web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/pos-web/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
