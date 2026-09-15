import React from 'react';
import { Lock, Cpu, Trash2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200/80 pt-8 pb-12 text-slate-500 text-xs sm:text-sm">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 font-semibold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Privacidad garantizada</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Tus fotos se comprimen localmente con Web Workers. No se suben a ningún servidor.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 font-semibold">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Ghostscript & Sharp</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Los documentos PDF y DOCX se procesan en un worker Docker aislado con compresión industrial.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-900 font-semibold">
            <Trash2 className="w-4 h-4 text-amber-600" />
            <span>Retención efímera</span>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">
            Los archivos de documentos se eliminan de forma permanente e irrecuperable a los 30 minutos.
          </p>
        </div>
      </div>

      <div className="text-center text-slate-400 text-xs mt-8">
        Comprimelo &copy; {new Date().getFullYear()} &mdash; Rápido, seguro y sin registros.
      </div>
    </footer>
  );
};
