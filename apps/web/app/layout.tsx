import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comprimelo — Reduce el peso de tus archivos al instante',
  description:
    'Comprime imágenes (JPG, PNG, WebP, AVIF) en tu navegador y documentos (PDF, Word) de forma rápida, segura y 100% gratuita.',
  keywords: ['comprimir imagenes', 'comprimir pdf', 'comprimir word docx', 'reducir peso de archivo', 'optimizador de imagenes'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          {/* Subtle background gradient glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-100/40 via-teal-50/20 to-transparent blur-3xl -z-10" />
          
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
