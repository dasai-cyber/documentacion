FROM node:20-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ghostscript && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

RUN useradd -m appuser && mkdir -p /tmp/work && chown -R appuser:appuser /tmp/work /app
USER appuser

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
