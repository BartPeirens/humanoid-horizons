FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

RUN npm install -g sirv-cli

COPY --from=builder /app/build ./build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sirv", "build", "--host", "0.0.0.0", "--port", "3000", "--single"]
