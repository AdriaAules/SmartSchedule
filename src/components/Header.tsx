import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  SlidersHorizontal,
  ChevronDown,
  Download,
  Undo2,
  Globe
} from 'lucide-react';
import { Language } from '../types/schedule';
import { translations } from '../utils/i18n';
import { formatHeaderDate } from '../utils/dateUtils';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  onOpenSettings,
  onOpenExport,
  canUndo,
  onUndo
}) => {
  const t = translations[language];

  // Real-time current date
  const [realDate, setRealDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setRealDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#18392b] flex items-center justify-center text-white shadow-xs">
          <CalendarIcon className="w-5 h-5 text-emerald-300" strokeWidth={2.2} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">
          {t.appName}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Real current date pill */}
        <div className="hidden md:flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs">
          {formatHeaderDate(realDate, language)}
        </div>

        {/* Undo / Desfer Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={t.undo}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            canUndo
              ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs active:scale-95'
              : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.undo}</span>
        </button>

        {/* Language selector dropdown */}
        <div className="relative flex items-center">
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="pl-7 pr-7 py-1.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
          >
            <option value="ca">Català</option>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          title={t.exportBtn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">{t.exportBtn}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title={t.settingsTitle}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
