'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { formatBytes } from '@/lib/formatBytes';
import { generatePdfFromImages } from '@/lib/generatePdfFromImages';
import { QueueItem } from '@/types';
import {
  Images,
  FileText,
  CheckSquare,
  Square,
  Download,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';

export const ImageGalleryPdf: React.FC = () => {
  const { queue } = useFileStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<'a4' | 'fitImage'>('a4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);

  // Filter only images from the global file queue
  const imageItems = useMemo(
    () => queue.filter((item) => item.kind === 'image'),
    [queue]
  );

  // Automatically select newly added images by default
  useEffect(() => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      // Retain only IDs that still exist in imageItems
      const currentIds = new Set(imageItems.map((i) => i.id));
      for (const id of Array.from(updated)) {
        if (!currentIds.has(id)) {
          updated.delete(id);
        }
      }
      // Add any new image IDs by default
      for (const item of imageItems) {
        if (!prev.has(item.id)) {
          updated.add(item.id);
        }
      }
      return updated;
    });
  }, [imageItems]);

  if (imageItems.length === 0) {
    return null;
  }

  const selectedItems = imageItems.filter((item) => selectedIds.has(item.id));
  const isAllSelected = selectedItems.length === imageItems.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(imageItems.map((i) => i.id)));
    }
  };

  const handleGeneratePdf = async () => {
    if (selectedItems.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setPdfProgress({ current: 1, total: selectedItems.length });

    try {
      await generatePdfFromImages(selectedItems, {
        pageSize,
        filename: `album-imagenes-${new Date().toISOString().slice(0, 10)}.pdf`,
        onProgress: (current, total) => {
          setPdfProgress({ current, total });
        },
      });
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert(err.message || 'Error al generar el PDF con las imágenes seleccionadas.');
    } finally {
      setIsGenerating(false);
      setPdfProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Images className="w-4 h-4 text-emerald-600" />
            <span>Galería de imágenes & Exportar a PDF</span>
          </div>
          <p className="text-xs text-slate-500">
            Selecciona las imágenes que deseas compilar en un único archivo PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Deseleccionar todas</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seleccionar todas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Image Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {imageItems.map((item) => (
          <ImageCard
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
          />
        ))}
      </div>

      {/* Action Footer for PDF Creation */}
      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/70">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold text-slate-700">
            {selectedItems.length} de {imageItems.length} seleccionadas
          </span>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="text-slate-400">Formato:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as 'a4' | 'fitImage')}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="a4">Páginas A4 estándar</option>
              <option value="fitImage">Ajustar al tamaño de la foto</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGeneratePdf}
          disabled={selectedItems.length === 0 || isGenerating}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>
                Compilando PDF ({pdfProgress?.current || 1}/{pdfProgress?.total || selectedItems.length})...
              </span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Guardar seleccionadas en PDF ({selectedItems.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface ImageCardProps {
  item: QueueItem;
  isSelected: boolean;
  onToggle: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ item, isSelected, onToggle }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const targetBlob = item.resultBlob || item.file;
    const url = URL.createObjectURL(targetBlob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item.resultBlob, item.file]);

  return (
    <div
      onClick={onToggle}
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer select-none bg-slate-100 flex flex-col ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 opacity-85 hover:opacity-100'
      }`}
    >
      {/* Thumbnail Aspect Ratio Container */}
      <div className="relative w-full aspect-4/3 bg-slate-200 overflow-hidden flex items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        )}

        {/* Floating Checkbox */}
        <div className="absolute top-2 right-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-xs ${
              isSelected
                ? 'bg-emerald-600 text-white'
                : 'bg-white/90 text-transparent border border-slate-300 hover:bg-white'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* Savings Badge */}
        {item.savedPercent !== null && item.savedPercent > 0 && (
          <div className="absolute bottom-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>-{item.savedPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Caption info */}
      <div className="p-2.5 bg-white flex-1 flex flex-col justify-between space-y-1">
        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>{formatBytes(item.compressedSize || item.originalSize)}</span>
          {item.status === 'compressing' && (
            <span className="text-emerald-600 font-bold">Comprimiendo...</span>
          )}
        </div>
      </div>
    </div>
  );
};
