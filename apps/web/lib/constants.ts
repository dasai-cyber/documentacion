export const MAX_FILE_MB = 50;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const MAX_FILES_PER_BATCH = 20;

export const SUPPORTED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
  documents: ['.pdf', '.docx'],
};

export const ACCEPTED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const LEVEL_SETTINGS = {
  light: {
    label: 'Ligera',
    description: 'Máxima fidelidad visual, ideal para impresión o archivos importantes',
    imageQuality: 0.85,
    maxWidth: null,
    targetFormat: 'original',
    pdfSetting: '/prepress',
  },
  balanced: {
    label: 'Equilibrada',
    description: 'Excelente balance entre peso y calidad (Recomendado)',
    imageQuality: 0.72,
    maxWidth: 2560,
    targetFormat: 'webp',
    pdfSetting: '/ebook',
  },
  aggressive: {
    label: 'Máxima',
    description: 'Reducción extrema de peso para compartir rápido por web o correo',
    imageQuality: 0.55,
    maxWidth: 1600,
    targetFormat: 'webp',
    pdfSetting: '/screen',
  },
} as const;
