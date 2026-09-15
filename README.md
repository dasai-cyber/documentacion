# Comprimelo ⚡

Aplicación web híbrida de compresión y optimización de archivos (Imágenes, PDF, DOCX) y convertidor de imágenes a PDF.

## 🚀 Características

- **Imágenes (JPG, PNG, WebP, AVIF):** Compresión 100% en el navegador del cliente mediante Web Workers (sin subida de datos ni costos de servidor). Soporte completo para canal alfa y conversión inteligente a WebP.
- **Documentos PDF:** Compresión profunda con Ghostscript (perfiles prepress, ebook y screen con desduplicación de objetos y compresión de fuentes).
- **Documentos Word (DOCX):** Descompresión, redimensionamiento y recompresión de imágenes embebidas con Sharp a nivel Deflate 9 conservando la estructura XML del documento.
- **Galería de Imágenes & Exportación a PDF:** Visualización en cuadrícula de fotos subidas con selección múltiple y creación de PDF compuesto con ajuste a páginas A4 estándar.
- **Descarga masiva en ZIP:** Empaquetado en un solo clic con JSZip.
- **Privacidad total:** Eliminación automática de temporales tras 30 minutos.

## 📂 Estructura del Monorepo

```
├── apps/
│   ├── web/        # Frontend en Next.js 14 (App Router) + Tailwind CSS + Zustand
│   └── worker/     # Worker Docker en Fastify + Ghostscript + Sharp
├── package.json
└── README.md
```

## 🛠️ Instalación y Desarrollo Local

```bash
# Instalar dependencias del monorepo
npm install

# Iniciar el frontend (Next.js) en http://localhost:3000
npm run dev:web

# Iniciar el worker de compresión en http://localhost:8080
npm run dev:worker
```

## 🚢 Despliegue

- **Frontend:** Vercel (carpeta `apps/web`)
- **Worker:** Railway / Render / Fly.io (usando `apps/worker/Dockerfile`)

---
Desarrollado con ❤️ para máxima velocidad y privacidad.
