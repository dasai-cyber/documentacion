import AdmZip from 'adm-zip';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { CompressionLevel, CompressResult } from '../types.js';
import { logger } from '../lib/logger.js';

const QUALITY_MAP: Record<CompressionLevel, number> = {
  light: 85,
  balanced: 72,
  aggressive: 55,
};

const MAX_IMAGE_DIMENSION = 1920;

export async function compressDocx(
  inputPath: string,
  outputPath: string,
  level: CompressionLevel = 'balanced'
): Promise<CompressResult> {
  const originalStats = await fs.promises.stat(inputPath);
  const originalSize = originalStats.size;
  const quality = QUALITY_MAP[level] || 72;

  logger.info(`Starting DOCX compression (Quality: ${quality})...`);

  try {
    const zip = new AdmZip(inputPath);
    const zipEntries = zip.getEntries();

    let docXmlFound = false;
    let imagesCompressed = 0;

    for (const entry of zipEntries) {
      if (entry.entryName === 'word/document.xml') {
        docXmlFound = true;
      }

      // Check if entry is an embedded media file in word/media/
      if (entry.entryName.startsWith('word/media/') && !entry.isDirectory) {
        const lowerName = entry.entryName.toLowerCase();
        const isJpg = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg');
        const isPng = lowerName.endsWith('.png');

        if (isJpg || isPng) {
          try {
            const rawBuffer = entry.getData();
            let sharpInstance = sharp(rawBuffer);
            const metadata = await sharpInstance.metadata();

            let shouldResize = false;
            let targetWidth = metadata.width;
            let targetHeight = metadata.height;

            if (metadata.width && metadata.width > MAX_IMAGE_DIMENSION) {
              shouldResize = true;
              targetWidth = MAX_IMAGE_DIMENSION;
            } else if (metadata.height && metadata.height > MAX_IMAGE_DIMENSION) {
              shouldResize = true;
              targetHeight = MAX_IMAGE_DIMENSION;
            }

            if (shouldResize) {
              sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
                fit: 'inside',
                withoutEnlargement: true,
              });
            }

            let optimizedBuffer: Buffer;
            if (isJpg) {
              optimizedBuffer = await sharpInstance
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
            } else {
              // PNG: Optimize compression level and apply palette quantization if aggressive
              optimizedBuffer = await sharpInstance
                .png({
                  compressionLevel: 9,
                  quality: level === 'aggressive' ? 70 : 90,
                  palette: level === 'aggressive',
                })
                .toBuffer();
            }

            // Only replace if optimized buffer is smaller than original image buffer
            if (optimizedBuffer.length < rawBuffer.length) {
              entry.setData(optimizedBuffer);
              imagesCompressed++;
            }
          } catch (imgErr) {
            logger.warn(`Could not compress embedded image ${entry.entryName}:`, imgErr);
            // Keep original entry intact
          }
        }
      }
    }

    if (!docXmlFound) {
      throw new Error('El archivo no es un documento Word válido (falta word/document.xml)');
    }

    // Write output ZIP
    zip.writeZip(outputPath);

    // Verify written ZIP integrity
    const verifyZip = new AdmZip(outputPath);
    const verifyDoc = verifyZip.getEntry('word/document.xml');
    if (!verifyDoc) {
      throw new Error('Error de validación: el documento resultante está incompleto');
    }

    const compressedStats = await fs.promises.stat(outputPath);
    const compressedSize = compressedStats.size;

    // Regla de Oro: si el archivo resultante es más grande o igual, entregar el original
    if (compressedSize >= originalSize) {
      logger.info(`DOCX result was larger or equal (${compressedSize} >= ${originalSize}). Returning original.`);
      await fs.promises.copyFile(inputPath, outputPath);
      return {
        outputPath,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        skipped: true,
      };
    }

    const savedPercent = Number((((originalSize - compressedSize) / originalSize) * 100).toFixed(2));
    logger.info(`DOCX compressed successfully (${imagesCompressed} images optimized): ${originalSize} -> ${compressedSize} (-${savedPercent}%)`);

    return {
      outputPath,
      originalSize,
      compressedSize,
      savedPercent,
      skipped: false,
    };
  } catch (error: any) {
    logger.error('DOCX compression failed:', error);
    throw new Error(`Error durante la compresión del DOCX: ${error.message}`);
  }
}
