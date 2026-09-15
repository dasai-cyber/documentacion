import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { WORK_DIR, tempStore } from '../lib/tempStore.js';
import { validateUploadedFile } from '../lib/validate.js';
import { compressPdf } from '../compressors/pdf.js';
import { compressDocx } from '../compressors/docx.js';
import { CompressionLevel } from '../types.js';
import { logger } from '../lib/logger.js';

export const compressRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/compress', async (request, reply) => {
    let tempInputPath: string | null = null;
    let tempOutputPath: string | null = null;

    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          error: 'NO_FILE',
          message: 'No se envió ningún archivo para comprimir.',
        });
      }

      const fileId = nanoid(8);
      const originalFilename = data.filename || 'document';
      const ext = path.extname(originalFilename).toLowerCase();

      // Extract compression level from field if provided
      let level: CompressionLevel = 'balanced';
      const levelField = (data.fields as any)?.level?.value;
      if (levelField === 'light' || levelField === 'aggressive' || levelField === 'balanced') {
        level = levelField;
      }

      tempInputPath = path.join(WORK_DIR, `input_${fileId}${ext}`);
      tempOutputPath = path.join(WORK_DIR, `output_${fileId}${ext}`);

      // Stream file to temporary disk
      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(tempInputPath!);
        data.file.pipe(writeStream);
        data.file.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
      });

      const inputStats = await fs.promises.stat(tempInputPath);
      const validation = await validateUploadedFile(tempInputPath, originalFilename, inputStats.size);

      if (!validation.valid) {
        return reply.status(400).send({
          error: validation.code || 'INVALID_TYPE',
          message: validation.error || 'Archivo inválido.',
        });
      }

      let compressResult;
      if (validation.detectedExt === 'pdf' || ext === '.pdf') {
        compressResult = await compressPdf(tempInputPath, tempOutputPath, level);
      } else if (validation.detectedExt === 'docx' || ext === '.docx') {
        compressResult = await compressDocx(tempInputPath, tempOutputPath, level);
      } else {
        return reply.status(415).send({
          error: 'UNSUPPORTED_TYPE',
          message: 'Solo se admite compresión de PDF y DOCX en el servidor.',
        });
      }

      // Store in tempStore
      const savedRecord = tempStore.save({
        id: fileId,
        filePath: compressResult.outputPath,
        originalName: originalFilename,
        mimeType: validation.detectedMime || 'application/octet-stream',
        originalSize: compressResult.originalSize,
        compressedSize: compressResult.compressedSize,
        savedPercent: compressResult.savedPercent,
        skipped: compressResult.skipped,
      });

      return reply.send({
        id: fileId,
        originalSize: savedRecord.originalSize,
        compressedSize: savedRecord.compressedSize,
        savedPercent: savedRecord.savedPercent,
        skipped: savedRecord.skipped,
        downloadUrl: `/download/${fileId}`,
        expiresAt: savedRecord.expiresAt.toISOString(),
      });
    } catch (err: any) {
      logger.error('Error in /compress handler:', err);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: err.message || 'Error interno al procesar el archivo.',
      });
    } finally {
      // Clean up input file
      if (tempInputPath && fs.existsSync(tempInputPath)) {
        try {
          await fs.promises.unlink(tempInputPath);
        } catch (e) {
          logger.warn(`Could not delete input file ${tempInputPath}:`, e);
        }
      }
    }
  });
};
