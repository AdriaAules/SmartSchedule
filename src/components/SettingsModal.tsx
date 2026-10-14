import React, { useState } from 'react';
import { X, SlidersHorizontal, Clock, Globe } from 'lucide-react';
import { GridConfig, Language } from '../types/schedule';
import { translations } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GridConfig;
  onSaveConfig: (newConfig: GridConfig) => void;
  language: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  language
}) => {
  const t = translations[language];

  const [startHour, setStartHour] = useState(config.startHour);
  const [endHour, setEndHour] = useState(config.endHour);
  const [timezone, setTimezone] = useState(config.timezone || 'GMT+2');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startHour >= endHour) return;
    onSaveConfig({
      startHour: Number(startHour),
      endHour: Number(endHour),
      timezone
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              {t.settingsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Ajusta l'amplitud de la jornada diària per adaptar-la al teu ritme d'estudi o laboral.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.startHour}
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {[6, 7, 8, 9, 10].map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.endHour}
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {[17, 18, 19, 20, 21, 22, 23].map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Zona Horària
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="GMT+2">GMT+2 (Europa / Madrid)</option>
              <option value="GMT+1">GMT+1 (Europa Central)</option>
              <option value="GMT+0">GMT+0 (UTC / Londres)</option>
              <option value="GMT-5">GMT-5 (Amèrica / Nova York)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#18392b] hover:bg-[#23503c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
