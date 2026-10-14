import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Minus, ChevronDown, Lock, Unlock } from 'lucide-react';
import { BlockType, ScheduleBlock, SmartTask, Language } from '../types/schedule';
import { translations } from '../utils/i18n';
import { minutesToTime, timeToMinutes } from '../utils/optimizer';
import { COLOR_THEMES } from '../utils/colorThemes';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Omit<SmartTask, 'id' | 'isCompleted'>) => void;
  onSaveBlock: (block: Omit<ScheduleBlock, 'id'>) => void;
  language: Language;
  initialSlot?: { dayOfWeek: number; hour: number; minute?: number };
  editingBlock?: ScheduleBlock | null;
  editingTask?: SmartTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  onSaveBlock,
  language,
  initialSlot,
  editingBlock,
  editingTask
}) => {
  const t = translations[language];

  const isEditing = Boolean(editingBlock || editingTask);

  const [activeType, setActiveType] = useState<BlockType>('fixed');
  const [isLockedState, setIsLockedState] = useState<boolean>(true);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [deadlineDate, setDeadlineDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Calculate End Time automatically from Start Time + Duration
  const endTimeCalculated = React.useMemo(() => {
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + durationMinutes;
    return minutesToTime(endMins);
  }, [startTime, durationMinutes]);

  // Reset fields when opening modal
  useEffect(() => {
    if (!isOpen) return;

    setIsColorPickerOpen(false);

    if (editingBlock) {
      const locked = editingBlock.isLocked ?? (editingBlock.type === 'fixed');
      setIsLockedState(locked);
      setActiveType(locked ? 'fixed' : 'flexible');
      setTitle(editingBlock.title || '');
      setDayOfWeek(editingBlock.dayOfWeek);
      setStartTime(editingBlock.startTime);
      setDurationMinutes(editingBlock.durationMinutes || 60);
      setSelectedColor(editingBlock.color || 'indigo');
      setLocation(editingBlock.location || '');
      setCategory(editingBlock.category || '');
    } else if (editingTask) {
      setIsLockedState(false);
      setActiveType(editingTask.type);
      setTitle(editingTask.title || '');
      setDurationMinutes(editingTask.durationMinutes || 60);
      setDeadlineDate(editingTask.deadline || new Date().toISOString().split('T')[0]);
      setSelectedColor(editingTask.type === 'punctual' ? 'rose' : 'emerald');
    } else {
      // NEW ACTIVITY: Title is always completely empty
      setTitle('');
      setLocation('');
      setCategory('');
      setDurationMinutes(60);
      setDeadlineDate(new Date().toISOString().split('T')[0]);

      if (initialSlot) {
        setIsLockedState(true);
        setActiveType('fixed');
        const m = initialSlot.minute ?? 0;
        setStartTime(`${String(initialSlot.hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        setSelectedColor('indigo');
      } else {
        setIsLockedState(true);
        setActiveType('fixed');
        setDayOfWeek(1);
        setStartTime('09:00');
        setSelectedColor('indigo');
      }
    }
  }, [isOpen, editingBlock, editingTask, initialSlot]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingBlock || activeType === 'fixed' || activeType === 'flexible') {
      // Both Fixed and Flexible blocks share the exact same fields on the schedule!
      onSaveBlock({
        title: title.trim(),
        type: isLockedState ? 'fixed' : 'flexible',
        dayOfWeek,
        startTime,
        endTime: endTimeCalculated,
        durationMinutes,
        location: location.trim() || undefined,
        category: category.trim() || undefined,
        color: selectedColor,
        isLocked: isLockedState,
        isRecurringWeekly: true
      });
    } else {
      // Tasca Puntual per a la llista
      onSaveTask({
        title: title.trim(),
        type: 'punctual',
        durationMinutes,
        deadline: deadlineDate,
        priority: 'high'
      });
    }

    onClose();
  };

  const formatDurationReadable = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m (${mins} min)`;
    if (h > 0) return `${h} ${h === 1 ? 'hora' : 'hores'} (${mins} min)`;
    return `${m} minuts`;
  };

  const activeTheme = COLOR_THEMES[selectedColor] || COLOR_THEMES.indigo;

  // Modal Title depends cleanly on whether editing or creating
  const modalTitle = isEditing
    ? editingBlock
      ? 'Editar Bloc de l\'Horari'
      : 'Editar Tasca de la Llista'
    : 'Nova Activitat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                {modalTitle}
              </h3>
              {editingBlock && (
                <button
                  type="button"
                  onClick={() => {
                    const nextLocked = !isLockedState;
                    setIsLockedState(nextLocked);
                    setActiveType(nextLocked ? 'fixed' : 'flexible');
                  }}
                  title="Clica per canviar entre Fix i Flexible"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                    isLockedState
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  {isLockedState ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Fix (tancat)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Flexible (obert)</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Modifica les dades de l\'activitat seleccionada'
                : 'Tria el tipus i omple els camps de l\'activitat'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: ONLY show tabs when CREATING a new activity! When editing, no tab-jumping */}
        {!isEditing && (
          <div className="p-2 bg-slate-100/70 border-b border-slate-200 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveType('fixed');
                setIsLockedState(true);
                setSelectedColor('indigo');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'fixed'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Bloc Fix</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveType('flexible');
                setIsLockedState(false);
                setSelectedColor('emerald');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'flexible'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Bloc Flexible</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveType('punctual');
                setIsLockedState(false);
                setSelectedColor('rose');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'punctual'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Tasca Puntual</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 1. Nom */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom de l'activitat *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.taskTitlePlaceholder}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              autoFocus
            />
          </div>

          {/* 2. Durada estimada: només els steppers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t.durationMinutes}
              </label>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                {formatDurationReadable(durationMinutes)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDurationMinutes((prev) => Math.max(15, prev - 15))}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center font-mono font-bold text-sm text-slate-800 bg-slate-50 py-2 rounded-xl border border-slate-200">
                {durationMinutes} minuts
              </div>
              <button
                type="button"
                onClick={() => setDurationMinutes((prev) => Math.min(480, prev + 15))}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Dades de Bloc Fix I Flexible: SÓN IDÈNTIQUES! (Dia, Hora inici/fi, Ubicació, Categoria) */}
          {(editingBlock || activeType === 'fixed' || activeType === 'flexible') && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.dayOfWeekLabel}
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {t.days.map((day, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.startTimeLabel}
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.endTimeLabel} (calculat)
                  </label>
                  <div className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-600 font-bold">
                    {endTimeCalculated}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ubicació
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Aula 2.1, Campus Nord..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Teoria, Lab, Esport..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dades per a Tasca Puntual (Data) */}
          {(editingTask || (!editingBlock && activeType === 'punctual')) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.dateLabel}
              </label>
              <input
                type="date"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
              />
            </div>
          )}

          {/* 4. Selector de color AL FINAL DE TOT */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Color de l'activitat
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full ${activeTheme.accentBar} shadow-2xs`} />
                  <span className="text-xs font-semibold text-slate-800">
                    {activeTheme.name}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isColorPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Panell de colors desplegable */}
              {isColorPickerOpen && (
                <div className="mt-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 shadow-md grid grid-cols-4 gap-2 animate-in fade-in duration-100">
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedColor(key);
                        setIsColorPickerOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedColor === key
                          ? 'bg-white border-slate-800 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${theme.accentBar} shrink-0`} />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold bg-[#18392b] hover:bg-[#23503c] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
