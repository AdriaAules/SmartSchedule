import React from 'react';
import { X, Download, FileSpreadsheet, Calendar, Printer } from 'lucide-react';
import { ScheduleBlock, Language } from '../types/schedule';
import { translations } from '../utils/i18n';
import { exportToIcs, exportToCsv } from '../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: ScheduleBlock[];
  workspaceName: string;
  language: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  blocks,
  workspaceName,
  language
}) => {
  const t = translations[language];

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadIcs = () => {
    exportToIcs(blocks, workspaceName);
    onClose();
  };

  const handleDownloadCsv = () => {
    exportToCsv(blocks, workspaceName);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              {t.exportBtn}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500">
            Tria el format de descàrrega per sincronitzar amb altres aplicacions o compartir.
          </p>

          <button
            onClick={handleDownloadIcs}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 text-left transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                {t.exportIcal}
              </div>
              <div className="text-[11px] text-slate-400">
                Google Calendar, Apple Calendar, Outlook
              </div>
            </div>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 text-left transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                {t.exportCsv}
              </div>
              <div className="text-[11px] text-slate-400">
                Excel, Google Sheets, taules de càlcul
              </div>
            </div>
          </button>

          <button
            onClick={handlePrint}
            className="w-full p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {t.exportPrint}
              </div>
              <div className="text-[11px] text-slate-400">
                Vista neta per a imprimir o desar en PDF
              </div>
            </div>
          </button>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
