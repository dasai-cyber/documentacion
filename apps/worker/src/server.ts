import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { compressRoutes } from './routes/compress.js';
import { downloadRoutes } from './routes/download.js';
import { healthRoutes } from './routes/health.js';
import { logger } from './lib/logger.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const WORKER_TOKEN = process.env.WORKER_TOKEN;

async function buildServer() {
  const fastify = Fastify({
    logger: false,
    bodyLimit: 55 * 1024 * 1024, // 55 MB
  });

  // CORS setup
  await fastify.register(cors, {
    origin: ALLOWED_ORIGIN === '*' ? true : ALLOWED_ORIGIN.split(','),
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Rate limiter (30 requests per 10 minutes)
  await fastify.register(rateLimit, {
    max: 30,
    timeWindow: '10 minutes',
  });

  // Multipart file upload support
  await fastify.register(multipart, {
    limits: {
      fileSize: 52 * 1024 * 1024, // 52 MB limit
      files: 1,
    },
  });

  // Token authentication hook (if configured)
  if (WORKER_TOKEN && WORKER_TOKEN !== 'development-secret-token') {
    fastify.addHook('onRequest', async (request, reply) => {
      // Exempt health endpoint from auth
      if (request.url === '/health' || request.url.startsWith('/download/')) {
        return;
      }
      const authHeader = request.headers['authorization'] || request.headers['x-worker-token'];
      if (authHeader !== `Bearer ${WORKER_TOKEN}` && authHeader !== WORKER_TOKEN) {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Token de acceso inválido.' });
      }
    });
  }

  // Register routes
  await fastify.register(compressRoutes);
  await fastify.register(downloadRoutes);
  await fastify.register(healthRoutes);

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: HOST });
    logger.info(`Comprimelo Worker running on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error('Failed to start worker server:', err);
    process.exit(1);
  }
}

start();
