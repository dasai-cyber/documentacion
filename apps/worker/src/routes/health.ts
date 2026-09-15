import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getGhostscriptVersion } from '../compressors/pdf.js';

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/health', async (_request, reply) => {
    const gsVersion = await getGhostscriptVersion();
    return reply.send({
      ok: true,
      ghostscript: gsVersion || 'no disponible en el host',
    });
  });
};
