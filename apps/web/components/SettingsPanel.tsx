import React from 'react';
import { useFileStore } from '@/store/useFileStore';
import { LEVEL_SETTINGS } from '@/lib/constants';
import { CompressionLevel } from '@/types';
import { Sliders, RefreshCw, Check } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { settings, setSettings, queue, recompressAll, isProcessing } = useFileStore();

  const handleLevelChange = (level: CompressionLevel) => {
    setSettings({ level });
  };

  const handleKeepFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ keepFormat: e.target.checked });
  };

  const hasItems = queue.length > 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>Ajustes de compresión</span>
        </div>
        {hasItems && (
          <button
            onClick={() => recompressAll()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
            title="Volver a comprimir los archivos con los ajustes seleccionados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Reaplicar ajustes</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(LEVEL_SETTINGS) as CompressionLevel[]).map((key) => {
          const opt = LEVEL_SETTINGS[key];
          const isSelected = settings.level === key;

          return (
            <label
              key={key}
              onClick={() => handleLevelChange(key)}
              className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className={`text-sm font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {opt.label}
                  </span>
                </div>
                {key === 'balanced' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Recomendado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 pl-6 leading-relaxed">
                {opt.description}
              </p>
            </label>
          );
        })}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.keepFormat}
            onChange={handleKeepFormatChange}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-offset-0 transition-colors"
          />
          <span className="font-medium text-slate-700">
            Mantener formato original de las imágenes
          </span>
        </label>
        <span className="text-[11px] text-slate-400">
          {!settings.keepFormat
            ? 'Convertirá PNG/JPG a WebP para máxima reducción'
            : 'Conserva extensiones originales (.png, .jpg)'}
        </span>
      </div>
    </div>
  );
};
