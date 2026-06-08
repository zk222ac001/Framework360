FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma

RUN npm install

COPY backend/ .

EXPOSE 3000
EXPOSE 5555

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run dev"]