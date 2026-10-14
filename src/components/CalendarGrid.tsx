import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Plus,
  Clock,
  MapPin,
  BookOpen,
  Code2,
  Dumbbell,
  Coffee,
  GraduationCap,
  CalendarDays,
  Lock,
  Unlock,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { ScheduleBlock, ViewMode, Language, GridConfig, SmartTask } from '../types/schedule';
import { translations } from '../utils/i18n';
import { getWeekDays, getRealMonthCalendar, DayInfo } from '../utils/dateUtils';
import { timeToMinutes } from '../utils/optimizer';
import { getBlockTheme } from '../utils/colorThemes';

interface CalendarGridProps {
  blocks: ScheduleBlock[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridConfig: GridConfig;
  language: Language;
  onAddBlockAtSlot: (dayOfWeek: number, hour: number, minute?: number) => void;
  onEditBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newDay: number, newStartMinutes: number) => void;
  onConvertTaskToBlock: (task: SmartTask, dayOfWeek: number, startMinutes: number) => void;
  onToggleBlockLock: (blockId: string) => void;
}

const HOUR_HEIGHT = 68;

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  blocks,
  viewMode,
  onViewModeChange,
  gridConfig,
  language,
  onAddBlockAtSlot,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  onConvertTaskToBlock,
  onToggleBlockLock
}) => {
  const t = translations[language];

  // Robust Anchor Date: single source of truth for Day, Week, and Month navigation
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  // Week computation memoized based on anchorDate and language
  const { days: weekDays, weekLabel } = useMemo(
    () => getWeekDays(anchorDate, language),
    [anchorDate, language]
  );

  // Month computation memoized based on anchorDate and language
  const realMonth = useMemo(
    () => getRealMonthCalendar(anchorDate, language),
    [anchorDate, language]
  );

  // Selected day of the week for Day view (1 to 7)
  const currentDayOfWeek = useMemo(() => {
    const d = anchorDate.getDay();
    return d === 0 ? 7 : d;
  }, [anchorDate]);

  // Dropdown popover state for slots with > 3 activities
  const [activeSlotPopover, setActiveSlotPopover] = useState<{
    dayOfWeek: number;
    hour: number;
    blocks: ScheduleBlock[];
    anchorRect?: DOMRect;
  } | null>(null);

  // Hours array from startHour to endHour
  const hours = useMemo(
    () =>
      Array.from(
        { length: gridConfig.endHour - gridConfig.startHour },
        (_, i) => gridConfig.startHour + i
      ),
    [gridConfig.startHour, gridConfig.endHour]
  );
  const totalGridHeight = hours.length * HOUR_HEIGHT;

  // Group recurring blocks by dayOfWeek and punctual by dateKey for O(1) retrieval
  const blocksByDayOfWeek = useMemo(() => {
    const map = new Map<number, ScheduleBlock[]>();
    for (let d = 1; d <= 7; d++) map.set(d, []);
    for (const b of blocks) {
      if (b.type !== 'punctual' || !b.deadline) {
        const list = map.get(b.dayOfWeek);
        if (list) list.push(b);
      }
    }
    return map;
  }, [blocks]);

  const punctualBlocksByDateKey = useMemo(() => {
    const map = new Map<string, ScheduleBlock[]>();
    for (const b of blocks) {
      if (b.type === 'punctual' && b.deadline) {
        const list = map.get(b.deadline) || [];
        list.push(b);
        map.set(b.deadline, list);
      }
    }
    return map;
  }, [blocks]);

  const getBlocksForDay = useCallback(
    (dayInfo: DayInfo) => {
      const recurring = blocksByDayOfWeek.get(dayInfo.dayOfWeek) || [];
      const punctual = punctualBlocksByDateKey.get(dayInfo.dateKey) || [];
      return [...recurring, ...punctual];
    },
    [blocksByDayOfWeek, punctualBlocksByDateKey]
  );

  const getBlocksCountForMonthCell = useCallback(
    (cell: { dateKey: string; dayOfWeek: number }) => {
      const recurringCount = blocksByDayOfWeek.get(cell.dayOfWeek)?.length || 0;
      const punctualCount = punctualBlocksByDateKey.get(cell.dateKey)?.length || 0;
      return recurringCount + punctualCount;
    },
    [blocksByDayOfWeek, punctualBlocksByDateKey]
  );

  // Navigation handlers
  const handleNavPrev = useCallback(() => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'dia') {
        d.setDate(d.getDate() - 1);
      } else if (viewMode === 'mes') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  }, [viewMode]);

  const handleNavNext = useCallback(() => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'dia') {
        d.setDate(d.getDate() + 1);
      } else if (viewMode === 'mes') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  }, [viewMode]);

  const handleNavToday = useCallback(() => {
    setAnchorDate(new Date());
  }, []);

  // Drag & Drop handlers with 30-minute sensitivity
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropAtMinutes = useCallback(
    (e: React.DragEvent, dayOfWeek: number, startMinutes: number) => {
      e.preventDefault();
      const rawData = e.dataTransfer.getData('application/json');
      if (!rawData) return;

      try {
        const data = JSON.parse(rawData);
        if (data.type === 'existing-block') {
          onMoveBlock(data.id, dayOfWeek, startMinutes);
        } else if (data.type === 'from-task') {
          onConvertTaskToBlock(data.task, dayOfWeek, startMinutes);
        }
      } catch (err) {
        console.error('Drop error', err);
      }
    },
    [onMoveBlock, onConvertTaskToBlock]
  );

  // Helper to get visual icon
  const getBlockIcon = (title: string, category?: string) => {
    const text = `${title} ${category || ''}`.toLowerCase();
    if (text.includes('prog') || text.includes('codi') || text.includes('software') || text.includes('java') || text.includes('c ')) {
      return <Code2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
    }
    if (text.includes('gim') || text.includes('esport') || text.includes('entrenament') || text.includes('run')) {
      return <Dumbbell className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
    }
    if (text.includes('pausa') || text.includes('dinar') || text.includes('cafè') || text.includes('descans')) {
      return <Coffee className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
    }
    if (text.includes('magistral') || text.includes('aula') || text.includes('seminari')) {
      return <GraduationCap className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
    }
    return <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-500" />;
  };

  const formatDurationShort = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };


  const getSlotActivities = (dayBlocks: ScheduleBlock[], hour: number) => {
    const slotStart = hour * 60;
    const slotEnd = (hour + 1) * 60;

    return dayBlocks.filter((b) => {
      const s = timeToMinutes(b.startTime);
      const e = timeToMinutes(b.endTime);
      return s < slotEnd && e > slotStart;
    });
  };

  const getSpanningBlocks = (dayBlocks: ScheduleBlock[]) => {
    const startBound = gridConfig.startHour * 60;

    return dayBlocks.map((b) => {
      const s = timeToMinutes(b.startTime);
      const e = timeToMinutes(b.endTime);
      const dur = Math.max(30, e - s);
      const top = ((s - startBound) / 60) * HOUR_HEIGHT;
      const height = (dur / 60) * HOUR_HEIGHT - 3;
      return { block: b, top, height };
    });
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-x-auto min-w-[850px] select-none">
      {/* Top Header Bar: Title, Subtitle, Navigation, View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {viewMode === 'semana'
              ? t.yourWeek
              : viewMode === 'dia'
              ? t.yourDay
              : realMonth.monthName}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {viewMode === 'semana'
              ? weekLabel
              : viewMode === 'dia'
              ? anchorDate.toLocaleDateString(language === 'ca' ? 'ca-ES' : 'es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : `${realMonth.cells.length} dies al calendari`}
          </p>
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-2xs">
            <button
              onClick={() => onViewModeChange('dia')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.dayView}
            </button>
            <button
              onClick={() => onViewModeChange('semana')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.weekView}
            </button>
            <button
              onClick={() => onViewModeChange('mes')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.monthView}
            </button>
          </div>
        </div>
      </div>

      {/* Control Row: Navigation Arrows, Today button, Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Previous Arrow */}
          <button
            onClick={handleNavPrev}
            title="Anterior"
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNavNext}
            title="Següent"
            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
            {t.dragHint}
          </span>
        </div>

        {/* Total events status */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>
            {blocks.length === 0
              ? t.noEvents
              : t.eventsCount.replace('{count}', String(blocks.length))}
          </span>
        </div>
      </div>

      {/* 1. WEEK VIEW */}
      {viewMode === 'semana' && (
        <div className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col">
          {/* Header Row: GMT + 7 Equal Days */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200 bg-white sticky top-0 z-20">
            {/* GMT Column */}
            <div className="p-3 text-[11px] font-mono font-medium text-slate-400 flex items-center justify-center border-r border-slate-200 bg-slate-50/50">
              {gridConfig.timezone}
            </div>

            {/* 7 Days of the Week */}
            {weekDays.map((dayInfo) => {
              const dayShort = t.daysShort[dayInfo.dayOfWeek - 1];

              return (
                <div
                  key={dayInfo.dayOfWeek}
                  onClick={() => {
                    setAnchorDate(dayInfo.date);
                    onViewModeChange('dia');
                  }}
                  className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 cursor-pointer transition-colors hover:bg-slate-50/80 ${
                    dayInfo.isToday ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">
                    {dayShort}
                  </div>
                  <div className="mt-1 flex items-center justify-center">
                    {dayInfo.isToday ? (
                      <div className="w-7 h-7 rounded-full bg-[#18392b] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                        {dayInfo.dayNumber}
                      </div>
                    ) : (
                      <div className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-slate-700">
                        {dayInfo.dayNumber}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div
            className="grid grid-cols-[70px_repeat(7,1fr)] relative"
            style={{ height: `${totalGridHeight}px` }}
          >
            {/* Time labels column */}
            <div className="border-r border-slate-200 bg-slate-50/30 relative">
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="absolute w-full text-center text-xs font-mono font-semibold text-slate-400 border-b border-slate-100 flex items-start justify-center pt-2"
                  style={{
                    top: `${i * HOUR_HEIGHT}px`,
                    height: `${HOUR_HEIGHT}px`
                  }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* 7 Day Columns */}
            {weekDays.map((dayInfo) => {
              const dayBlocks = getBlocksForDay(dayInfo);
              const spanningList = getSpanningBlocks(dayBlocks);

              return (
                <div
                  key={dayInfo.dayOfWeek}
                  className={`border-r border-slate-200 last:border-r-0 relative transition-colors ${
                    dayInfo.isToday ? 'bg-emerald-50/10' : 'bg-white'
                  }`}
                >
                  {/* Hourly background lines & Drop/Add targets (divided into :00 and :30) */}
                  {hours.map((h, i) => {
                    const slotActs = getSlotActivities(dayBlocks, h);
                    const count = slotActs.length;

                    return (
                      <div
                        key={h}
                        className="absolute w-full border-b border-slate-100/90 pointer-events-auto"
                        style={{
                          top: `${i * HOUR_HEIGHT}px`,
                          height: `${HOUR_HEIGHT}px`
                        }}
                      >
                        {/* Top half (:00 to :30) */}
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropAtMinutes(e, dayInfo.dayOfWeek, h * 60)}
                          onClick={() => {
                            if (count === 0) onAddBlockAtSlot(dayInfo.dayOfWeek, h, 0);
                          }}
                          title={`${String(h).padStart(2, '0')}:00`}
                          className="h-1/2 w-full hover:bg-slate-50/70 border-b border-dashed border-slate-100 transition-colors cursor-pointer group/top flex items-center justify-center"
                        >
                          {count === 0 && (
                            <Plus className="w-3 h-3 text-slate-200 opacity-0 group-hover/top:opacity-100 transition-opacity" />
                          )}
                        </div>

                        {/* Bottom half (:30 to :00) */}
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropAtMinutes(e, dayInfo.dayOfWeek, h * 60 + 30)}
                          onClick={() => {
                            if (count === 0) onAddBlockAtSlot(dayInfo.dayOfWeek, h, 30);
                          }}
                          title={`${String(h).padStart(2, '0')}:30`}
                          className="h-1/2 w-full hover:bg-slate-50/70 transition-colors cursor-pointer group/bottom flex items-center justify-center"
                        >
                          {count === 0 && (
                            <Plus className="w-3 h-3 text-slate-200 opacity-0 group-hover/bottom:opacity-100 transition-opacity" />
                          )}
                        </div>

                        {/* More than 3 activities: dots at bottom-left */}
                        {count > 3 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSlotPopover({
                                dayOfWeek: dayInfo.dayOfWeek,
                                hour: h,
                                blocks: slotActs,
                                anchorRect: e.currentTarget.getBoundingClientRect()
                              });
                            }}
                            className="absolute bottom-1.5 left-2 flex items-center gap-1 p-1 bg-white/95 rounded-full shadow-xs border border-slate-200 z-20 cursor-pointer hover:scale-105 transition-transform"
                          >
                            {slotActs.slice(0, 4).map((act, idx) => {
                              const dotTheme = getBlockTheme(act.color, act.type);
                              return (
                                <span
                                  key={idx}
                                  className={`w-2 h-2 rounded-full ${dotTheme.accentBar}`}
                                />
                              );
                            })}
                            <span className="text-[9px] font-bold text-slate-700 px-0.5">
                              +{count - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render activities */}
                  {spanningList.map(({ block, top, height }) => {
                    const theme = getBlockTheme(block.color, block.type);
                    // Check if block is considered locked/fixed
                    const isBlockLocked = block.isLocked ?? (block.type === 'fixed');

                    return (
                      <div
                        key={block.id}
                        draggable={!isBlockLocked}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/json',
                            JSON.stringify({ type: 'existing-block', id: block.id })
                          );
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropY = e.clientY - rect.top;
                          const cardStartMins = timeToMinutes(block.startTime);
                          const rawMins = cardStartMins + (dropY / HOUR_HEIGHT) * 60;
                          const snappedMins = Math.round(rawMins / 30) * 30;
                          handleDropAtMinutes(e, dayInfo.dayOfWeek, snappedMins);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBlock(block);
                        }}
                        className={`absolute left-1 right-1 rounded-xl border p-2 flex flex-col justify-between transition-all select-none shadow-2xs hover:shadow-md hover:z-20 overflow-hidden ${
                          isBlockLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                        } ${theme.cardBg} ${theme.cardBorder} ${theme.cardText}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`
                        }}
                      >
                        {/* Colored Left Accent Bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accentBar}`}
                        />

                        {/* Top: Icon & Title on LEFT, Padlock on the FAR RIGHT */}
                        <div className="pl-1">
                          <div className="flex items-center justify-between gap-1">
                            {/* Left: Title without cramped icon */}
                            <div className="min-w-0 flex-1 pr-1">
                              <span className="text-xs font-bold leading-tight truncate block">
                                {block.title}
                              </span>
                            </div>

                            {/* Far Right: Interactive Padlock (Closed amber vs Open green) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBlockLock(block.id);
                              }}
                              title={
                                isBlockLocked
                                  ? 'Bloc Fix (clica per fer-lo flexible)'
                                  : 'Bloc Flexible (clica per fixar-lo)'
                              }
                              className="p-1 rounded-md hover:bg-black/5 transition-transform hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                            >
                              {isBlockLocked ? (
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                              )}
                            </button>
                          </div>

                          {/* Clean Duration & Location with unshrinkable MapPin */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-80 mt-0.5">
                            <span className="font-bold shrink-0">
                              ({formatDurationShort(block.durationMinutes)})
                            </span>
                            {block.location && (
                              <span className="flex items-center gap-1 text-slate-500 min-w-0 overflow-hidden">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{block.location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Category tag if room */}
                        {height > 80 && block.category && (
                          <div className="pl-1 text-[9px] font-semibold opacity-75 truncate">
                            <span className="bg-white/80 px-1.5 py-0.5 rounded-md">
                              {block.category}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DAY VIEW */}
      {viewMode === 'dia' && (
        <div className="w-full flex-1 border border-slate-200 bg-white rounded-2xl shadow-xs p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#18392b] text-white flex items-center justify-center font-bold text-base shadow-2xs">
                {anchorDate.getDate()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t.days[currentDayOfWeek - 1]}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  {gridConfig.timezone} · Horari detallat del dia
                </p>
              </div>
            </div>

            {/* Quick 7-Day Pill Selector */}
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto overflow-x-auto">
              {weekDays.map((d) => (
                <button
                  key={d.dayOfWeek}
                  onClick={() => setAnchorDate(d.date)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    anchorDate.toDateString() === d.date.toDateString()
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{t.daysShort[d.dayOfWeek - 1]}</span>{' '}
                  <span className="text-[10px] font-normal">{d.dayNumber}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {hours.map((hour) => {
              const dayBlocks = blocks.filter((b) => {
                if (b.type === 'punctual' && b.deadline) {
                  return b.deadline === anchorDate.toISOString().split('T')[0];
                }
                return b.dayOfWeek === currentDayOfWeek;
              });

              const hourBlocks = dayBlocks.filter((b) => {
                const s = timeToMinutes(b.startTime);
                const e = timeToMinutes(b.endTime);
                return s < (hour + 1) * 60 && e > hour * 60;
              });

              const hourStr = `${String(hour).padStart(2, '0')}:00`;

              return (
                <div key={hour} className="flex items-start gap-4 min-h-[64px] group">
                  <div className="w-16 text-xs font-mono font-bold text-slate-400 pt-3 shrink-0 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span>{hourStr}</span>
                  </div>

                  <div className="flex-1">
                    {hourBlocks.length === 0 ? (
                      <div
                        onClick={() => onAddBlockAtSlot(currentDayOfWeek, hour)}
                        className="h-12 border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-xl flex items-center px-4 text-xs font-medium text-slate-400 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        <span>Espai lliure · Fes clic per afegir activitat</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {hourBlocks.map((b) => {
                          const theme = getBlockTheme(b.color, b.type);
                          const isBlockLocked = b.isLocked ?? (b.type === 'fixed');

                          return (
                            <div
                              key={b.id}
                              onClick={() => onEditBlock(b)}
                              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all shadow-2xs hover:shadow-sm cursor-pointer ${theme.cardBg} ${theme.cardBorder}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                                    {b.title}
                                  </h4>
                                </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                                    <span>
                                      {b.startTime}–{b.endTime}
                                    </span>
                                    <span>·</span>
                                    <span className="font-semibold">
                                      {b.durationMinutes} min
                                    </span>
                                    {b.location && (
                                      <>
                                        <span>·</span>
                                        <span className="flex items-center gap-1 min-w-0">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span className="truncate">{b.location}</span>
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                              <div className="flex items-center gap-2">
                                {/* Padlock toggle on FAR RIGHT */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleBlockLock(b.id);
                                  }}
                                  title={
                                    isBlockLocked
                                      ? 'Bloc Fix (clica per fer-lo flexible)'
                                      : 'Bloc Flexible (clica per fixar-lo)'
                                  }
                                  className="p-1.5 rounded-lg hover:bg-white transition-transform hover:scale-110 cursor-pointer"
                                >
                                  {isBlockLocked ? (
                                    <Lock className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <Unlock className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditBlock(b);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBlock(b.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTH VIEW */}
      {viewMode === 'mes' && (
        <div className="w-full flex-1 border border-slate-200 bg-white rounded-2xl shadow-xs p-6 flex flex-col">
          <div className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-700" />
              <span>{realMonth.monthName}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Fes clic en qualsevol dia per obrir la vista detallada
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 flex-1">
            {t.daysShort.map((d, i) => (
              <div
                key={i}
                className="text-center font-bold text-xs text-slate-400 py-1 uppercase"
              >
                {d}
              </div>
            ))}

            {realMonth.cells.map((cell, idx) => {
              const dayBlocksCount = getBlocksCountForMonthCell(cell);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setAnchorDate(cell.date);
                    onViewModeChange('dia');
                  }}
                  className={`h-24 p-2 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                    cell.isToday
                      ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20'
                      : 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-75'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      cell.isToday
                        ? 'text-emerald-950 font-black'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {dayBlocksCount > 0 && (
                    <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg truncate">
                      {dayBlocksCount} {dayBlocksCount === 1 ? 'classe' : 'classes'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popover for slots with > 3 activities */}
      {activeSlotPopover && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
          onClick={() => setActiveSlotPopover(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                {t.days[activeSlotPopover.dayOfWeek - 1]} · {String(activeSlotPopover.hour).padStart(2, '0')}:00
              </h4>
              <button
                onClick={() => setActiveSlotPopover(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activeSlotPopover.blocks.map((b) => {
                const theme = getBlockTheme(b.color, b.type);
                const isBlockLocked = b.isLocked ?? (b.type === 'fixed');

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      onEditBlock(b);
                      setActiveSlotPopover(null);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-xs ${theme.cardBg} ${theme.cardBorder}`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>{b.title}</span>
                        {isBlockLocked ? (
                          <Lock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Unlock className="w-3 h-3 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {b.startTime}–{b.endTime} ({b.durationMinutes}m)
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80">
                      Editar
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
