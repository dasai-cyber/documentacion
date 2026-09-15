import { FileKind } from '@/types';
import { MAX_FILE_BYTES } from './constants';

export function getFileKind(file: File): FileKind | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (
    type.startsWith('image/') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.avif')
  ) {
    return 'image';
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx';
  }

  return null;
}

export function validateFile(file: File): { valid: boolean; error?: string; kind?: FileKind } {
  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `El archivo supera el límite de 50 MB (${file.name})`,
    };
  }

  const kind = getFileKind(file);
  if (!kind) {
    return {
      valid: false,
      error: `Formato no soportado: ${file.name}. Solo se admiten JPG, PNG, WEBP, AVIF, PDF y DOCX.`,
    };
  }

  return { valid: true, kind };
}
