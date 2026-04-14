FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/backoffice/package.json ./apps/backoffice/
RUN pnpm install --frozen-lockfile --filter @hizlipos/backoffice
COPY apps/backoffice ./apps/backoffice
WORKDIR /app/apps/backoffice
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/apps/backoffice/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/backoffice/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/backoffice/public ./public
USER nextjs
EXPOSE 3002
CMD ["node", "server.js"]
