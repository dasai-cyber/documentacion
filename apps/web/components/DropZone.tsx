'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileStore } from '@/store/useFileStore';
import { ACCEPTED_MIME_TYPES, MAX_FILE_BYTES } from '@/lib/constants';
import { UploadCloud, FileImage, FileText, FileSpreadsheet, ArrowUpRight } from 'lucide-react';

export const DropZone: React.FC = () => {
  const addFiles = useFileStore((state) => state.addFiles);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        addFiles(acceptedFiles);
      }
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_BYTES,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 sm:p-12 text-center select-none ${
        isDragActive
          ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99] ring-4 ring-emerald-500/20'
          : isDragReject
          ? 'border-red-400 bg-red-50/70'
          : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/60 bg-white/70 shadow-xs'
      }`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
            isDragActive
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <p className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-center gap-1">
            <span>Arrastra y suelta tus archivos aquí</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            o <span className="text-emerald-700 font-semibold underline underline-offset-2 hover:text-emerald-800">haz clic para explorar</span> desde tu equipo
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            <FileImage className="w-3.5 h-3.5 text-emerald-600" />
            JPG · PNG · WebP · AVIF
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            PDF
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            DOCX (Word)
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          Hasta 50 MB por archivo &bull; Múltiples archivos a la vez
        </p>
      </div>
    </div>
  );
};
