import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import { tempStore } from '../lib/tempStore.js';
import { logger } from '../lib/logger.js';

export const downloadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { id: string } }>('/download/:id', async (request, reply) => {
    const { id } = request.params;
    const record = tempStore.get(id);

    if (!record || !fs.existsSync(record.filePath)) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: 'El archivo solicitado no existe o ya ha expirado.',
      });
    }

    const stream = fs.createReadStream(record.filePath);
    const safeFilename = encodeURIComponent(record.originalName);

    reply.header('Content-Type', record.mimeType);
    reply.header(
      'Content-Disposition',
      `attachment; filename="${record.originalName}"; filename*=UTF-8''${safeFilename}`
    );

    return reply.send(stream);
  });
};
