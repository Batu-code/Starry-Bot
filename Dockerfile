FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data /app/logs

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD ["node", "scripts/healthcheck.js"]

CMD ["npm", "run", "start:prod"]
