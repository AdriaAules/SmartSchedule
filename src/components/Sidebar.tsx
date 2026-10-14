import React, { useState } from 'react';
import {
  Check,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  GripVertical
} from 'lucide-react';
import { SmartTask, Language } from '../types/schedule';
import { translations } from '../utils/i18n';

interface SidebarProps {
  tasks: SmartTask[];
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onEditTask: (task: SmartTask) => void;
  onDeleteTask: (taskId: string) => void;
  language: Language;
}

const SERENE_TIPS_BY_LANG: Record<string, string[]> = {
  ca: [
    'Reserva marge entre blocs per canviar de context sense presses.',
    'Agrupa les tasques d\'alta concentració en les teves millors hores del matí.',
    'Fes pauses breus de 5-10 minuts després de blocs intensos per mantenir la ment desperta.',
    'Els blocs flexibles et donen llibertat per absorbir qualsevol imprevist amb calma.',
    'Un horari realista val més que un de perfecte: prioritza el benestar.',
    'Divideix els grans projectes en petits passos assolibles per evitar l\'angoixa.',
    'El descans de qualitat és el motor principal del teu rendiment acadèmic.'
  ],
  es: [
    'Reserva margen entre bloques para cambiar de contexto sin prisa.',
    'Agrupa las tareas de alta concentración en tus horas más lúcidas de la mañana.',
    'Haz pausas breves de 5-10 minutos tras bloques intensos para despejar la mente.',
    'Los bloques flexibles te permiten absorber imprevistos con total calma.',
    'Un horario realista vale más que uno perfecto: prioriza tu bienestar.',
    'Divide grandes proyectos en pasos pequeños para evitar el agobio.',
    'El descanso de calidad es la clave de tu rendimiento.'
  ],
  en: [
    'Leave buffer time between blocks to transition contexts without rushing.',
    'Group high-focus tasks during your peak morning energy windows.',
    'Take short 5-10 minute breaks between deep work sessions to refresh your mind.',
    'Flexible blocks grant you the freedom to absorb unexpected events serenely.',
    'A realistic schedule is better than a perfect one: prioritize balance.',
    'Break large projects into small, actionable steps to eliminate overwhelm.'
  ],
  fr: [
    'Gardez des marges entre les blocs pour changer de contexte sans stress.',
    'Regroupez vos tâches complexes lors de vos meilleures heures matinales.',
    'Faites des pauses de 5-10 minutes pour maintenir votre esprit vif.'
  ],
  de: [
    'Plane Puffer zwischen den Blöcken ein, um stressfrei zu wechseln.',
    'Erledige anspruchsvolle Aufgaben in deinen produktivsten Morgenstunden.',
    'Mache kurze Pausen von 5-10 Minuten, um den Kopf frei zu bekommen.'
  ]
};

export const Sidebar: React.FC<SidebarProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  language
}) => {
  const t = translations[language];
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Close task action menu on outside click
  React.useEffect(() => {
    if (!activeMenuTaskId) return;
    const handleClickOutside = () => setActiveMenuTaskId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuTaskId]);

  // Rotating tips state (cycles on entrance / click)
  const activeTips = SERENE_TIPS_BY_LANG[language] || SERENE_TIPS_BY_LANG.ca;
  const [currentTipIndex, setCurrentTipIndex] = useState(() => Math.floor(Math.random() * 5));

  const { totalCount, progressPercent } = React.useMemo(() => {
    const total = tasks.length;
    let completed = 0;
    for (const t of tasks) {
      if (t.isCompleted) completed++;
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalCount: total, progressPercent: pct };
  }, [tasks]);

  return (
    <aside className="w-80 shrink-0 bg-[#fafbfa] border-r border-slate-200 p-5 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      {/* Top Section */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t.smartTodoList}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200/70 text-slate-700">
              {totalCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {t.todoSubtitle}
          </p>
        </div>

        {/* Progress bar matching sketch */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-600">{t.todayProgress}</span>
            <span className="text-[#18392b] font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-[#e2ebe4] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2d6a4f] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="w-full mb-3 py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-98"
        >
          <Plus className="w-4 h-4 text-slate-500" />
          <span>{t.addTask}</span>
        </button>

        {/* Scrollable Tasks Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Sense tasques pendents
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.isCompleted;
              const isMenuOpen = activeMenuTaskId === task.id;

              return (
                <div
                  key={task.id}
                  draggable={!isCompleted}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        type: 'from-task',
                        task
                      })
                    );
                  }}
                  className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl bg-white hover:shadow-xs transition-all border border-slate-200/70 select-none ${
                    !isCompleted ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                >
                  {/* Drag Handle indicator */}
                  {!isCompleted && (
                    <div className="text-slate-300 group-hover:text-slate-400 pt-0.5 cursor-grab">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Custom Checkbox */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                      isCompleted
                        ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white shadow-2xs'
                        : 'border-slate-300 bg-white hover:border-[#2d6a4f]'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  {/* Task Text & Subtitle: ONLY ONE DOT */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onToggleTask(task.id)}
                  >
                    <p
                      className={`text-xs font-semibold leading-snug truncate transition-all ${
                        isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                      {/* Single status dot */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          isCompleted ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {isCompleted ? t.completed : t.toDo}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        ({task.durationMinutes}m)
                      </span>
                      {task.deadline && (
                        <span className="text-slate-400 text-[10px]">
                          · {task.deadline.slice(5)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Context menu button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuTaskId(isMenuOpen ? null : task.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                            setActiveMenuTaskId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          {t.edit}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                            setActiveMenuTaskId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t.delete}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Serene Focus card with rotating motivational tips */}
      <div
        onClick={() => setCurrentTipIndex((prev) => (prev + 1) % activeTips.length)}
        className="mt-4 p-4 rounded-2xl bg-[#e7f0e9] border border-[#d6e5d9] shrink-0 cursor-pointer hover:bg-[#dfecdf] transition-colors group select-none"
        title="Fes clic per veure un altre consell"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1b4332]">
            {t.calmFocusTitle}
          </div>
          <span className="text-[10px] text-[#2d6a4f] opacity-60 font-medium">
            Consell
          </span>
        </div>
        <p className="text-xs text-[#285740] leading-relaxed transition-all">
          {activeTips[currentTipIndex % activeTips.length]}
        </p>
      </div>
    </aside>
  );
};
