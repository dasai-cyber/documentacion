export type CompressionLevel = 'light' | 'balanced' | 'aggressive';

export interface TempFileRecord {
  id: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  skipped: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface CompressResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  skipped: boolean;
}
