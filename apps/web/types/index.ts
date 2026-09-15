export type FileStatus =
  | 'queued'
  | 'compressing'
  | 'done'
  | 'error'
  | 'skipped';   // El resultado salió más pesado o no se pudo optimizar más

export type FileKind = 'image' | 'pdf' | 'docx';

export type CompressionLevel = 'light' | 'balanced' | 'aggressive';

export interface QueueItem {
  id: string;
  file: File;
  kind: FileKind;
  name: string;
  originalSize: number;       // bytes
  compressedSize: number | null;
  savedPercent: number | null;
  status: FileStatus;
  progress: number;           // 0-100
  resultBlob: Blob | null;    // imágenes (cliente) o blob descargado
  downloadUrl: string | null; // PDF/DOCX (worker o blob url)
  error: string | null;
}

export interface Settings {
  level: CompressionLevel;
  keepFormat: boolean;        // false = permite convertir PNG/JPG -> WebP
  maxWidth: number | null;    // redimensionar imágenes (ej. 1920)
}

export interface WorkerCompressResponse {
  id: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  skipped: boolean;
  downloadUrl: string;
  expiresAt: string;
}

export interface WorkerErrorResponse {
  error: string;
  message: string;
}
