'use client';

import React from 'react';
import { useFileStore } from '@/store/useFileStore';
import { FileRow } from './FileRow';
import { Files, Trash2 } from 'lucide-react';

export const FileQueue: React.FC = () => {
  const { queue, clearQueue } = useFileStore();

  if (queue.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Files className="w-4 h-4 text-emerald-600" />
          <span>Archivos en cola ({queue.length})</span>
        </div>
        <button
          onClick={clearQueue}
          className="text-xs text-slate-500 hover:text-red-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar lista</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {queue.map((item) => (
          <FileRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
