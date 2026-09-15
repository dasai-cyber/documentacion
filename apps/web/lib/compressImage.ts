import imageCompression from 'browser-image-compression';
import { CompressionLevel, Settings } from '@/types';
import { LEVEL_SETTINGS } from './constants';

export interface ImageCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  skipped: boolean;
  outputName: string;
}

export async function compressImageClient(
  file: File,
  settings: Settings,
  onProgress?: (progress: number) => void
): Promise<ImageCompressionResult> {
  const originalSize = file.size;
  const config = LEVEL_SETTINGS[settings.level];

  // Determine output MIME type
  let targetFileType: string | undefined = undefined;
  let targetExtension: string = '';

  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const isJpg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');

  if (!settings.keepFormat && (settings.level === 'balanced' || settings.level === 'aggressive')) {
    // Convert to WebP for superior compression while preserving alpha
    targetFileType = 'image/webp';
    targetExtension = '.webp';
  } else {
    // Keep original format
    targetFileType = file.type || (isPng ? 'image/png' : 'image/jpeg');
  }

  const maxWidth = settings.maxWidth !== null ? settings.maxWidth : config.maxWidth;

  const options = {
    maxSizeMB: 50, // High ceiling so it won't over-compress down to an arbitrary size
    maxWidthOrHeight: maxWidth ? maxWidth : undefined,
    initialQuality: config.imageQuality,
    useWebWorker: true,
    fileType: targetFileType,
    onProgress: (p: number) => {
      if (onProgress) {
        onProgress(Math.min(99, Math.round(p)));
      }
    },
  };

  try {
    let compressedFile: File | Blob;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (workerErr) {
      // Fallback without web worker if environment restricts worker execution
      compressedFile = await imageCompression(file, { ...options, useWebWorker: false });
    }

    const compressedSize = compressedFile.size;

    // Regla de Oro: si no se logró reducir tamaño, entregar original
    if (compressedSize >= originalSize) {
      if (onProgress) onProgress(100);
      return {
        blob: file,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        skipped: true,
        outputName: file.name,
      };
    }

    const savedPercent = Number((((originalSize - compressedSize) / originalSize) * 100).toFixed(2));

    let outputName = file.name;
    if (targetExtension && !outputName.toLowerCase().endsWith(targetExtension)) {
      outputName = outputName.replace(/\.[^/.]+$/, '') + targetExtension;
    }

    if (onProgress) onProgress(100);

    return {
      blob: compressedFile,
      originalSize,
      compressedSize,
      savedPercent,
      skipped: false,
      outputName,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al comprimir imagen');
  }
}
