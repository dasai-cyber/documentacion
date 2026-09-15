'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { useFileStore } from '@/store/useFileStore';
import { formatBytes } from '@/lib/formatBytes';
import { DownloadCloud, Trash2, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

export const ResultSummary: React.FC = () => {
  const { queue, clearQueue } = useFileStore();
  const [isZipping, setIsZipping] = useState(false);

  const completedItems = queue.filter(
    (item) => item.status === 'done' || item.status === 'skipped'
  );

  if (completedItems.length === 0) {
    return null;
  }

  const totalOriginal = completedItems.reduce((acc, item) => acc + item.originalSize, 0);
  const totalCompressed = completedItems.reduce(
    (acc, item) => acc + (item.compressedSize || item.originalSize),
    0
  );
  const totalSaved = Math.max(0, totalOriginal - totalCompressed);
  const totalPercent = totalOriginal > 0 ? (totalSaved / totalOriginal) * 100 : 0;

  const handleDownloadAllZip = async () => {
    if (completedItems.length === 0 || isZipping) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();

      for (const item of completedItems) {
        if (item.resultBlob) {
          zip.file(item.name, item.resultBlob);
        } else if (item.downloadUrl) {
          try {
            const res = await fetch(item.downloadUrl);
            const blob = await res.blob();
            zip.file(item.name, blob);
          } catch (fetchErr) {
            console.error(`Error downloading file ${item.name} for ZIP:`, fetchErr);
            // Fallback to original file
            zip.file(item.name, item.file);
          }
        } else {
          zip.file(item.name, item.file);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprimelo-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
      alert('Hubo un error al generar el archivo ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Resumen de optimización</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Ahorraste {formatBytes(totalSaved)}{' '}
            <span className="text-slate-400 font-medium text-base sm:text-lg">
              de {formatBytes(totalOriginal)}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            {completedItems.length}{' '}
            {completedItems.length === 1 ? 'archivo procesado' : 'archivos procesados'} con una
            reducción promedio de{' '}
            <strong className="text-emerald-400 font-bold">
              {totalPercent.toFixed(1).replace('.', ',')}%
            </strong>
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-0">
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando ZIP...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4 stroke-[2.5]" />
                <span>Descargar todo (.zip)</span>
              </>
            )}
          </button>

          <button
            onClick={clearQueue}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-sm transition-colors cursor-pointer"
            title="Limpiar todos los archivos"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
