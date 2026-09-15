import FileType from 'file-type';
import fs from 'fs';

export const MAX_FILE_BYTES = (parseInt(process.env.MAX_FILE_MB || '50', 10)) * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'CORRUPT_FILE';
  detectedMime?: string;
  detectedExt?: string;
}

export async function validateUploadedFile(
  filePath: string,
  originalFilename: string,
  fileSize: number
): Promise<ValidationResult> {
  if (fileSize > MAX_FILE_BYTES) {
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      error: `El archivo supera el límite permitido de ${process.env.MAX_FILE_MB || 50} MB.`,
    };
  }

  try {
    const buffer = await fs.promises.readFile(filePath);
    const fileTypeResult = await FileType.fromBuffer(buffer);

    const ext = originalFilename.toLowerCase();

    // Check PDF magic bytes (%PDF-)
    if (ext.endsWith('.pdf')) {
      const isPdf =
        fileTypeResult?.mime === 'application/pdf' ||
        buffer.toString('utf-8', 0, 5).startsWith('%PDF-');

      if (!isPdf) {
        return {
          valid: false,
          code: 'INVALID_TYPE',
          error: 'El archivo tiene extensión .pdf pero su contenido no corresponde a un documento PDF válido.',
        };
      }

      return {
        valid: true,
        detectedMime: 'application/pdf',
        detectedExt: 'pdf',
      };
    }

    // Check DOCX magic bytes (ZIP header PK\x03\x04 with word/ folder)
    if (ext.endsWith('.docx')) {
      const isZip =
        fileTypeResult?.mime === 'application/zip' ||
        fileTypeResult?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        (buffer[0] === 0x50 && buffer[1] === 0x4b);

      if (!isZip) {
        return {
          valid: false,
          code: 'INVALID_TYPE',
          error: 'El archivo tiene extensión .docx pero su contenido no corresponde a un archivo Word válido.',
        };
      }

      return {
        valid: true,
        detectedMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        detectedExt: 'docx',
      };
    }

    return {
      valid: false,
      code: 'INVALID_TYPE',
      error: 'Formato no soportado en el servidor. Solo se admiten archivos .pdf y .docx.',
    };
  } catch (err) {
    return {
      valid: false,
      code: 'CORRUPT_FILE',
      error: 'No se pudo leer el archivo o el archivo está dañado.',
    };
  }
}
