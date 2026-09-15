import React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center space-y-4 pt-8 pb-4">
      <div className="inline-flex items-center justify-center p-2 bg-emerald-50 rounded-2xl ring-1 ring-emerald-200/60 shadow-xs mb-1">
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-xs text-xs font-semibold text-emerald-800">
          <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
          <span>Compresión inteligente v1.0</span>
        </div>
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
        Comprimelo<span className="text-emerald-600">.</span>
      </h1>
      
      <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
        Reduce el tamaño de tus <span className="font-semibold text-slate-800">imágenes</span>, <span className="font-semibold text-slate-800">PDFs</span> y documentos <span className="font-semibold text-slate-800">Word</span> sin perder calidad visible.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-1">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Imágenes 100% en tu navegador
        </span>
        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Sin marcas de agua ni límites diarios
        </span>
      </div>
    </header>
  );
};
