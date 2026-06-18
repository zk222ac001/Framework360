FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

RUN npx prisma generate
RUN mkdir -p /app/uploads/evidence && chown -R appuser:appgroup /app/uploads

USER appuser
EXPOSE 3000
CMD ["node", "src/server.js"]
