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
  RotateCw,
  RotateCcw,
  Loader2,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';

export const ImageGalleryPdf: React.FC = () => {
  const { queue } = useFileStore();
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState<'a4' | 'fitImage'>('a4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Filter only images from the global file queue
  const imageItemsMap = useMemo(() => {
    const map = new Map<string, QueueItem>();
    for (const item of queue) {
      if (item.kind === 'image') {
        map.set(item.id, item);
      }
    }
    return map;
  }, [queue]);

  // Sync orderedIds and selectedIds when queue changes
  useEffect(() => {
    const currentImageIds = Array.from(imageItemsMap.keys());

    setOrderedIds((prev) => {
      // Keep existing order for items that still exist
      const existingInOrder = prev.filter((id) => imageItemsMap.has(id));
      // Append any new image IDs not yet in orderedIds
      const newIds = currentImageIds.filter((id) => !prev.includes(id));
      return [...existingInOrder, ...newIds];
    });

    setSelectedIds((prev) => {
      const updated = new Set(prev);
      const currentIdsSet = new Set(currentImageIds);
      for (const id of Array.from(updated)) {
        if (!currentIdsSet.has(id)) {
          updated.delete(id);
        }
      }
      for (const id of currentImageIds) {
        if (!prev.has(id)) {
          updated.add(id);
        }
      }
      return updated;
    });
  }, [imageItemsMap]);

  // Get items in their current custom sorted order
  const orderedImageItems = useMemo(() => {
    return orderedIds
      .map((id) => imageItemsMap.get(id))
      .filter((item): item is QueueItem => Boolean(item));
  }, [orderedIds, imageItemsMap]);

  if (orderedImageItems.length === 0) {
    return null;
  }

  const selectedItems = orderedImageItems.filter((item) => selectedIds.has(item.id));
  const isAllSelected = selectedItems.length === orderedImageItems.length;

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
      setSelectedIds(new Set(orderedImageItems.map((i) => i.id)));
    }
  };

  const handleRotate = (id: string, deltaDegrees: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRotations((prev) => {
      const current = prev[id] || 0;
      const nextAngle = (current + deltaDegrees + 360) % 360;
      return { ...prev, [id]: nextAngle };
    });
  };

  const handleRotateSelected = (deltaDegrees: number) => {
    setRotations((prev) => {
      const updated = { ...prev };
      for (const id of Array.from(selectedIds)) {
        const current = updated[id] || 0;
        updated[id] = (current + deltaDegrees + 360) % 360;
      }
      return updated;
    });
  };

  // Reorder functions
  const moveItem = (fromIndex: number, toIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (toIndex < 0 || toIndex >= orderedIds.length || fromIndex === toIndex) return;

    setOrderedIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      moveItem(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleGeneratePdf = async () => {
    if (selectedItems.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setPdfProgress({ current: 1, total: selectedItems.length });

    try {
      await generatePdfFromImages(selectedItems, {
        pageSize,
        rotations,
        filename: `album-ordenado-${new Date().toISOString().slice(0, 10)}.pdf`,
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
            Arrastra las tarjetas o usa las flechas para ordenar las páginas del PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={() => handleRotateSelected(90)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-colors cursor-pointer"
              title="Girar todas las imágenes seleccionadas 90° a la derecha"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Girar seleccionadas 90°</span>
            </button>
          )}

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

      {/* Grid of Image Cards with Drag and Drop Reordering */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {orderedImageItems.map((item, index) => (
          <ImageCard
            key={item.id}
            item={item}
            index={index}
            totalCount={orderedImageItems.length}
            isSelected={selectedIds.has(item.id)}
            rotation={rotations[item.id] || 0}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index}
            onToggle={() => toggleSelect(item.id)}
            onRotate={(delta, e) => handleRotate(item.id, delta, e)}
            onMoveLeft={(e) => moveItem(index, index - 1, e)}
            onMoveRight={(e) => moveItem(index, index + 1, e)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Action Footer for PDF Creation */}
      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/70">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold text-slate-700">
            {selectedItems.length} de {orderedImageItems.length} seleccionadas (en orden 1 a {selectedItems.length})
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
                Generando PDF ordenado ({pdfProgress?.current || 1}/{pdfProgress?.total || selectedItems.length})...
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
  index: number;
  totalCount: number;
  isSelected: boolean;
  rotation: number;
  isDragging: boolean;
  isDragOver: boolean;
  onToggle: () => void;
  onRotate: (delta: number, e: React.MouseEvent) => void;
  onMoveLeft: (e: React.MouseEvent) => void;
  onMoveRight: (e: React.MouseEvent) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  item,
  index,
  totalCount,
  isSelected,
  rotation,
  isDragging,
  isDragOver,
  onToggle,
  onRotate,
  onMoveLeft,
  onMoveRight,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
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
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onToggle}
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer select-none bg-slate-100 flex flex-col ${
        isDragging
          ? 'opacity-30 scale-95 border-emerald-500'
          : isDragOver
          ? 'border-emerald-600 ring-4 ring-emerald-500/30 scale-102 shadow-lg'
          : isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 opacity-85 hover:opacity-100'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-4/3 bg-slate-200 overflow-hidden flex items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={item.name}
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
            className="w-full h-full object-contain transition-transform duration-300 ease-in-out p-1"
          />
        ) : (
          <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        )}

        {/* Page Order Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs pointer-events-none">
          <GripVertical className="w-3 h-3 text-slate-400" />
          <span>Pág. {index + 1}</span>
        </div>

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

        {/* Rotation indicator badge */}
        {rotation !== 0 && (
          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 pointer-events-none">
            <span>{rotation}°</span>
          </div>
        )}

        {/* Savings Badge */}
        {item.savedPercent !== null && item.savedPercent > 0 && (
          <div className="absolute bottom-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 pointer-events-none">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>-{item.savedPercent.toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Controls & info footer */}
      <div className="p-2.5 bg-white flex-1 flex flex-col justify-between space-y-2">
        <div>
          <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
            {item.name}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-0.5">
            <span>{formatBytes(item.compressedSize || item.originalSize)}</span>
            {rotation !== 0 && (
              <span className="text-emerald-600 font-bold">Girada {rotation}°</span>
            )}
          </div>
        </div>

        {/* Action button bar on card */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
          {/* Reordering arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveLeft}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Mover antes (izquierda)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === totalCount - 1}
              onClick={onMoveRight}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Mover después (derecha)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotation controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => onRotate(-90, e)}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Girar 90° antihorario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => onRotate(90, e)}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Girar 90° horario"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
