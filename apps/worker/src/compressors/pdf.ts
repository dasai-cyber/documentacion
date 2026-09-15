import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { CompressionLevel, CompressResult } from '../types.js';
import { logger } from '../lib/logger.js';

const execFileAsync = promisify(execFile);

const PDF_SETTINGS_MAP: Record<CompressionLevel, string> = {
  light: '/prepress',
  balanced: '/ebook',
  aggressive: '/screen',
};

// Look for gs binary across different OS environments
function getGhostscriptBinary(): string {
  if (process.env.GS_BIN) return process.env.GS_BIN;
  if (process.platform === 'win32') {
    // Windows might have gswin64c, gswin32c, or gs
    return 'gswin64c';
  }
  return 'gs';
}

export async function getGhostscriptVersion(): Promise<string | null> {
  const binary = getGhostscriptBinary();
  try {
    const { stdout } = await execFileAsync(binary, ['--version'], { timeout: 5000 });
    return stdout.trim();
  } catch {
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execFileAsync('gs', ['--version'], { timeout: 5000 });
        return stdout.trim();
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function compressPdf(
  inputPath: string,
  outputPath: string,
  level: CompressionLevel = 'balanced'
): Promise<CompressResult> {
  const originalStats = await fs.promises.stat(inputPath);
  const originalSize = originalStats.size;
  const pdfSetting = PDF_SETTINGS_MAP[level] || '/ebook';

  const gsBin = getGhostscriptBinary();

  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    `-dPDFSETTINGS=${pdfSetting}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-dSAFER',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  logger.info(`Starting PDF compression with Ghostscript (${pdfSetting})...`);

  try {
    try {
      await execFileAsync(gsBin, args, { timeout: 60000 });
    } catch (execErr: any) {
      if (process.platform === 'win32' && gsBin === 'gswin64c') {
        // Fallback to 'gs' or 'gswin32c'
        try {
          await execFileAsync('gs', args, { timeout: 60000 });
        } catch {
          await execFileAsync('gswin32c', args, { timeout: 60000 });
        }
      } else {
        throw execErr;
      }
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error('El archivo de salida no fue generado por Ghostscript');
    }

    const compressedStats = await fs.promises.stat(outputPath);
    const compressedSize = compressedStats.size;

    // Regla de Oro: si el archivo resultante es más grande o igual, entregar el original
    if (compressedSize >= originalSize) {
      logger.info(`PDF result was larger or equal (${compressedSize} >= ${originalSize}). Returning original.`);
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
    logger.info(`PDF compressed successfully: ${originalSize} -> ${compressedSize} (-${savedPercent}%)`);

    return {
      outputPath,
      originalSize,
      compressedSize,
      savedPercent,
      skipped: false,
    };
  } catch (error: any) {
    logger.error('Ghostscript compression failed or not available:', error.message);

    // If Ghostscript is missing on local host machine, copy original and return skipped
    if (error.code === 'ENOENT' || error.message.includes('not found')) {
      logger.warn('Ghostscript is not installed locally. Serving original file as fallback.');
      await fs.promises.copyFile(inputPath, outputPath);
      return {
        outputPath,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        skipped: true,
      };
    }

    throw new Error(`Error durante la compresión del PDF: ${error.message}`);
  }
}
