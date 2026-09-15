import { PDFDocument } from 'pdf-lib';
import { QueueItem } from '@/types';

/**
 * Loads an image from a Blob/File and converts it to a JPEG byte array
 * using an HTML5 Canvas, ensuring compatibility with pdf-lib.
 */
async function convertBlobToJpgBytes(blob: Blob): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('No se pudo inicializar el contexto 2D de canvas'));
        }

        // Fill background with white in case image has alpha transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          async (jpegBlob) => {
            URL.revokeObjectURL(url);
            if (!jpegBlob) {
              return reject(new Error('No se pudo convertir la imagen a formato JPEG'));
            }
            const arrayBuffer = await jpegBlob.arrayBuffer();
            resolve({
              bytes: new Uint8Array(arrayBuffer),
              width: img.naturalWidth,
              height: img.naturalHeight,
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
  onProgress?: (current: number, total: number) => void;
}

export async function generatePdfFromImages(
  items: QueueItem[],
  options: GeneratePdfOptions = {}
): Promise<Blob> {
  if (items.length === 0) {
    throw new Error('No hay imágenes seleccionadas para generar el PDF');
  }

  const { pageSize = 'a4', onProgress } = options;
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
    const { bytes, width: imgWidth, height: imgHeight } = await convertBlobToJpgBytes(sourceBlob);

    const embeddedImage = await pdfDoc.embedJpg(bytes);

    if (pageSize === 'fitImage') {
      // Create page exact size of image
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      // A4 page with auto-orientation (portrait or landscape)
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
  const defaultName = `imagenes-comprimelo-${new Date().toISOString().slice(0, 10)}.pdf`;
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
