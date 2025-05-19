# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

EXPOSE 9001

ENTRYPOINT ["./entrypoint.sh"]