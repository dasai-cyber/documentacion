import { PDFDocument } from 'pdf-lib';
import { QueueItem } from '@/types';

/**
 * Loads an image from a Blob/File and converts it to a JPEG byte array
 * using an HTML5 Canvas, applying rotation (0, 90, 180, 270 deg)
 * and ensuring compatibility with pdf-lib.
 */
async function convertBlobToJpgBytes(
  blob: Blob,
  rotation: number = 0
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const normalizedRotation = ((rotation % 360) + 360) % 360;
        const rad = (normalizedRotation * Math.PI) / 180;

        const origW = img.naturalWidth;
        const origH = img.naturalHeight;

        if (normalizedRotation === 90 || normalizedRotation === 270) {
          canvas.width = origH;
          canvas.height = origW;
        } else {
          canvas.width = origW;
          canvas.height = origH;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('No se pudo inicializar el contexto 2D de canvas'));
        }

        // Fill background with white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply rotation transformations
        ctx.save();
        if (normalizedRotation === 90) {
          ctx.translate(canvas.width, 0);
          ctx.rotate(rad);
        } else if (normalizedRotation === 180) {
          ctx.translate(canvas.width, canvas.height);
          ctx.rotate(rad);
        } else if (normalizedRotation === 270) {
          ctx.translate(0, canvas.height);
          ctx.rotate(rad);
        }

        ctx.drawImage(img, 0, 0, origW, origH);
        ctx.restore();

        canvas.toBlob(
          async (jpegBlob) => {
            URL.revokeObjectURL(url);
            if (!jpegBlob) {
              return reject(new Error('No se pudo convertir la imagen a formato JPEG'));
            }
            const arrayBuffer = await jpegBlob.arrayBuffer();
            resolve({
              bytes: new Uint8Array(arrayBuffer),
              width: canvas.width,
              height: canvas.height,
            });
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen para el PDF'));
    };

    img.src = url;
  });
}

export interface GeneratePdfOptions {
  pageSize?: 'a4' | 'fitImage';
  filename?: string;
  rotations?: Record<string, number>; // id -> degrees (0, 90, 180, 270)
  onProgress?: (current: number, total: number) => void;
}

export async function generatePdfFromImages(
  items: QueueItem[],
  options: GeneratePdfOptions = {}
): Promise<Blob> {
  if (items.length === 0) {
    throw new Error('No hay imágenes seleccionadas para generar el PDF');
  }

  const { pageSize = 'a4', rotations = {}, onProgress } = options;
  const pdfDoc = await PDFDocument.create();

  // A4 dimensions in points (72 points = 1 inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MARGIN = 30;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, items.length);
    }

    const sourceBlob = item.resultBlob || item.file;
    const rotation = rotations[item.id] || 0;
    const { bytes, width: imgWidth, height: imgHeight } = await convertBlobToJpgBytes(sourceBlob, rotation);

    const embeddedImage = await pdfDoc.embedJpg(bytes);

    if (pageSize === 'fitImage') {
      // Create page exact size of the (possibly rotated) image
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      // A4 page with auto-orientation based on rotated dimensions
      const isLandscape = imgWidth > imgHeight;
      const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const printableWidth = pageWidth - MARGIN * 2;
      const printableHeight = pageHeight - MARGIN * 2;

      // Scale proportionally to fit within printable bounds
      const scaleFactor = Math.min(
        printableWidth / imgWidth,
        printableHeight / imgHeight
      );

      const drawWidth = imgWidth * scaleFactor;
      const drawHeight = imgHeight * scaleFactor;

      // Center image on page
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  // Trigger download in browser
  const defaultName = `album-imagenes-${new Date().toISOString().slice(0, 10)}.pdf`;
  const filename = options.filename || defaultName;

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return pdfBlob;
}
