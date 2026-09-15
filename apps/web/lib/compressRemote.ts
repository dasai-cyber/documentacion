import { Settings, WorkerCompressResponse } from '@/types';

export interface RemoteCompressionResult {
  downloadUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  skipped: boolean;
  blob?: Blob;
}

export async function compressRemoteDocument(
  file: File,
  settings: Settings,
  onProgress?: (progress: number) => void
): Promise<RemoteCompressionResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('level', settings.level);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/proxy/compress', true);

    // Track upload progress (0% - 60%)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 60);
        onProgress(percent);
      }
    };

    // Simulate worker processing progress (60% - 95%)
    let progressTimer: NodeJS.Timeout | null = null;
    let currentProgress = 60;
    progressTimer = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += 5;
        if (onProgress) onProgress(currentProgress);
      }
    }, 400);

    xhr.onload = async () => {
      if (progressTimer) clearInterval(progressTimer);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: WorkerCompressResponse = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100);

          resolve({
            downloadUrl: data.downloadUrl,
            originalSize: data.originalSize,
            compressedSize: data.compressedSize,
            savedPercent: data.savedPercent,
            skipped: data.skipped,
          });
        } catch (e) {
          reject(new Error('Respuesta inválida del servidor'));
        }
      } else {
        let errorMsg = 'Error en el servidor de compresión';
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.message) errorMsg = errData.message;
        } catch (_) {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      if (progressTimer) clearInterval(progressTimer);
      reject(new Error('No se pudo conectar con el servidor de compresión'));
    };

    xhr.ontimeout = () => {
      if (progressTimer) clearInterval(progressTimer);
      reject(new Error('Tiempo de espera agotado al comprimir el archivo'));
    };

    xhr.timeout = 120000; // 2 minutes timeout
    xhr.send(formData);
  });
}
