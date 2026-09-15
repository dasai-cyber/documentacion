'use client';

import React from 'react';
import { QueueItem } from '@/types';
import { formatBytes } from '@/lib/formatBytes';
import { useFileStore } from '@/store/useFileStore';
import {
  FileImage,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface FileRowProps {
  item: QueueItem;
}

export const FileRow: React.FC<FileRowProps> = ({ item }) => {
  const { removeFile, processItem } = useFileStore();

  const handleDownload = () => {
    if (item.downloadUrl) {
      const link = document.createElement('a');
      link.href = item.downloadUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    switch (item.kind) {
      case 'image':
        return <FileImage className="w-6 h-6 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-600" />;
      case 'docx':
        return <FileSpreadsheet className="w-6 h-6 text-blue-600" />;
      default:
        return <FileText className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3">
      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* File icon and info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            {getFileIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="text-sm font-bold text-slate-900 truncate"
              title={item.name}
            >
              {item.name}
            </h4>

            {/* Status & size information */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-0.5">
              {item.status === 'done' && (
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-slate-400 line-through">
                    {formatBytes(item.originalSize)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-emerald-700">
                    {formatBytes(item.compressedSize || item.originalSize)}
                  </span>
                  {item.savedPercent !== null && item.savedPercent > 0 && (
                    <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      -{item.savedPercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              )}

              {item.status === 'skipped' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">
                    {formatBytes(item.originalSize)}
                  </span>
                  <span className="inline-flex items-center bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                    Ya estaba optimizado
                  </span>
                </div>
              )}

              {item.status === 'compressing' && (
                <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Comprimiendo... {item.progress}%
                </span>
              )}

              {item.status === 'queued' && (
                <span className="text-slate-400">
                  {formatBytes(item.originalSize)} &bull; En cola
                </span>
              )}

              {item.status === 'error' && (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-xs">{item.error || 'Error al procesar'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {(item.status === 'done' || item.status === 'skipped') && item.downloadUrl && (
            <button
              onClick={handleDownload}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                item.status === 'done'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
          )}

          {item.status === 'error' && (
            <button
              onClick={() => processItem(item.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
            >
              Reintentar
            </button>
          )}

          <button
            onClick={() => removeFile(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Eliminar de la lista"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar during compression */}
      {item.status === 'compressing' && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
