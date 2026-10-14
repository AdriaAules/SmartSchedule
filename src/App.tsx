/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScheduleBlock, SmartTask, ViewMode, Language, GridConfig, ScheduleState } from './types/schedule';
import { initialBlocks, initialTasks } from './utils/starterData';
import { minutesToTime, timeToMinutes } from './utils/optimizer';
import { placeBlockWithDisplacement, revertDisplacedBlocks } from './utils/displacement';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CalendarGrid } from './components/CalendarGrid';
import { TaskModal } from './components/TaskModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { AlertCircle, X } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'smartschedule_state_v4';
const LANG_KEY = 'smartschedule_lang';

export default function App() {
  // Load saved state or default
  const [scheduleState, setScheduleState] = useState<ScheduleState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading schedule state', e);
    }
    return {
      blocks: initialBlocks,
      tasks: initialTasks,
      gridConfig: {
        startHour: 8,
        endHour: 18,
        timezone: 'GMT+2'
      }
    };
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'ca' || saved === 'es' || saved === 'en' || saved === 'fr' || saved === 'de') {
        return saved;
      }
    } catch (e) {}
    return 'ca';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('semana');

  // History stack for Undo (capped to 25 steps to avoid memory leaks)
  const [history, setHistory] = useState<ScheduleState[]>([]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [initialSlotForTask, setInitialSlotForTask] = useState<{ dayOfWeek: number; hour: number; minute?: number } | undefined>();
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Floating notification toast for rejected displacements
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduleState));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }, [scheduleState]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch (e) {}
  }, [language]);

  // Stable helper to update schedule state with undo history
  const updateState = useCallback((updater: (prev: ScheduleState) => ScheduleState) => {
    setScheduleState((prevState) => {
      setHistory((prevHistory) => [...prevHistory.slice(-25), prevState]);
      return updater(prevState);
    });
  }, []);

  // Undo Handler
  const handleUndo = useCallback(() => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const previous = prevHistory[prevHistory.length - 1];
      setScheduleState(previous);
      return prevHistory.slice(0, -1);
    });
  }, []);

  // Keyboard shortcut Ctrl+Z / Cmd+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // Task Handlers
  const handleToggleTask = useCallback((taskId: string) => {
    updateState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    }));
  }, [updateState]);

  const handleSaveTask = useCallback((newTaskData: Omit<SmartTask, 'id' | 'isCompleted'>) => {
    if (editingTask) {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === editingTask.id ? { ...t, ...newTaskData } : t
        )
      }));
      setEditingTask(null);
    } else {
      const newTask: SmartTask = {
        ...newTaskData,
        id: `task-${Date.now()}`,
        isCompleted: false
      };
      updateState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks]
      }));
    }
  }, [editingTask, updateState]);

  const handleDeleteTask = useCallback((taskId: string) => {
    updateState((prev) => {
      const taskToDelete = prev.tasks.find((t) => t.id === taskId);
      let updatedBlocks = prev.blocks;
      if (taskToDelete?.scheduledBlockId) {
        const remaining = prev.blocks.filter((b) => b.id !== taskToDelete.scheduledBlockId);
        updatedBlocks = revertDisplacedBlocks(remaining, taskToDelete.scheduledBlockId);
      }
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
        blocks: updatedBlocks
      };
    });
  }, [updateState]);

  // Block Handlers with Bidirectional Displacement & Dynamic Snap-Back Support
  const handleSaveBlock = useCallback((newBlockData: Omit<ScheduleBlock, 'id'>) => {
    const startMins = timeToMinutes(newBlockData.startTime);
    const blockId = editingBlock ? editingBlock.id : `block-${Date.now()}`;
    const blockToPlace: ScheduleBlock = {
      ...newBlockData,
      id: blockId
    };

    // If editing an existing block, first revert any blocks displaced by its old position
    const baseBlocks = editingBlock
      ? revertDisplacedBlocks(scheduleState.blocks, editingBlock.id)
      : scheduleState.blocks;

    const res = placeBlockWithDisplacement(
      baseBlocks,
      blockToPlace,
      newBlockData.dayOfWeek,
      startMins,
      scheduleState.gridConfig.startHour,
      scheduleState.gridConfig.endHour
    );

    if (!res.success) {
      setToastMessage(res.errorMessage || 'No s\'ha pogut desar per col·lisió horària.');
      return;
    }

    updateState((prev) => ({
      ...prev,
      blocks: res.blocks
    }));
    setEditingBlock(null);
    setIsTaskModalOpen(false);
  }, [editingBlock, scheduleState.blocks, scheduleState.gridConfig, updateState]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    updateState((prev) => {
      // 1. Remove the target block
      const remaining = prev.blocks.filter((b) => b.id !== blockId);
      // 2. Dynamically snap back any blocks that had been displaced by this block!
      const reverted = revertDisplacedBlocks(remaining, blockId);
      return {
        ...prev,
        blocks: reverted,
        tasks: prev.tasks.map((t) =>
          t.scheduledBlockId === blockId ? { ...t, scheduledBlockId: undefined } : t
        )
      };
    });
  }, [updateState]);

  // Direct Padlock toggle on calendar block: Lock (Fixed) <-> Unlock (Flexible)
  const handleToggleBlockLock = useCallback((blockId: string) => {
    updateState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const isCurrentlyLocked = b.isLocked ?? (b.type === 'fixed');
        const nextLocked = !isCurrentlyLocked;
        return {
          ...b,
          isLocked: nextLocked,
          type: nextLocked ? 'fixed' : 'flexible'
        };
      })
    }));
  }, [updateState]);

  // Move Block dynamically via Drag & Drop with 30-minute sensitivity, bidirectional displacement and snap-back
  const handleMoveBlock = useCallback((blockId: string, newDay: number, newStartMinutes: number) => {
    // 1. Revert any blocks displaced by this block at its old position
    const cleanedBlocks = revertDisplacedBlocks(scheduleState.blocks, blockId);
    const targetBlock = cleanedBlocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    const startMins = newStartMinutes < 24 ? newStartMinutes * 60 : newStartMinutes;

    const res = placeBlockWithDisplacement(
      cleanedBlocks,
      targetBlock,
      newDay,
      startMins,
      scheduleState.gridConfig.startHour,
      scheduleState.gridConfig.endHour
    );

    if (!res.success) {
      setToastMessage(res.errorMessage || 'No hi ha prou espai per moure aquí.');
      return;
    }

    updateState((prev) => ({
      ...prev,
      blocks: res.blocks
    }));
  }, [scheduleState.blocks, scheduleState.gridConfig, updateState]);

  // Drag task from sidebar into the calendar grid with 30-minute sensitivity
  const handleConvertTaskToBlock = useCallback((
    task: SmartTask,
    dayOfWeek: number,
    startMinutes: number
  ) => {
    // If this task was already scheduled, move its existing block
    if (task.scheduledBlockId) {
      const existing = scheduleState.blocks.find((b) => b.id === task.scheduledBlockId);
      if (existing) {
        handleMoveBlock(existing.id, dayOfWeek, startMinutes);
        return;
      }
    }
    const duration = task.durationMinutes || 60;
    const startMins = startMinutes < 24 ? startMinutes * 60 : startMinutes;
    const endMins = startMins + duration;

    const newBlock: ScheduleBlock = {
      id: `block-from-${task.id}-${Date.now()}`,
      title: task.title,
      type: task.type === 'punctual' ? 'punctual' : 'flexible',
      dayOfWeek,
      startTime: minutesToTime(startMins),
      endTime: minutesToTime(endMins),
      durationMinutes: duration,
      color: task.type === 'punctual' ? 'rose' : 'emerald',
      deadline: task.deadline,
      isLocked: false,
      isRecurringWeekly: task.type !== 'punctual'
    };

    const res = placeBlockWithDisplacement(
      scheduleState.blocks,
      newBlock,
      dayOfWeek,
      startMins,
      scheduleState.gridConfig.startHour,
      scheduleState.gridConfig.endHour
    );

    if (!res.success) {
      setToastMessage(res.errorMessage || 'No hi ha espai per col·locar la tasca.');
      return;
    }

    updateState((prev) => ({
      ...prev,
      blocks: res.blocks,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              scheduledBlockId: newBlock.id
            }
          : t
      )
    }));
  }, [handleMoveBlock, scheduleState.blocks, scheduleState.gridConfig, updateState]);

  // Grid Config Update
  const handleSaveGridConfig = useCallback((newConfig: GridConfig) => {
    updateState((prev) => ({
      ...prev,
      gridConfig: newConfig
    }));
  }, [updateState]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 relative">
      {/* Floating feedback notification for collision/displacement prevention */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 max-w-md">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed flex-1">
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        canUndo={history.length > 0}
        onUndo={handleUndo}
      />

      {/* Main Layout: Left Sidebar + Central Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Smart To-Do Sidebar */}
        <Sidebar
          tasks={scheduleState.tasks}
          onToggleTask={handleToggleTask}
          onAddTask={() => {
            setEditingTask(null);
            setEditingBlock(null);
            setInitialSlotForTask(undefined);
            setIsTaskModalOpen(true);
          }}
          onEditTask={(task) => {
            setEditingTask(task);
            setEditingBlock(null);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          language={language}
        />

        {/* Central Calendar View */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa]">
          <CalendarGrid
            blocks={scheduleState.blocks}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridConfig={scheduleState.gridConfig}
            language={language}
            onAddBlockAtSlot={(dayOfWeek, hour, minute) => {
              setInitialSlotForTask({ dayOfWeek, hour, minute });
              setEditingBlock(null);
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onEditBlock={(block) => {
              setEditingBlock(block);
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            onConvertTaskToBlock={handleConvertTaskToBlock}
            onToggleBlockLock={handleToggleBlockLock}
          />
        </main>
      </div>

      {/* Task & Block Creation/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingBlock(null);
          setEditingTask(null);
          setInitialSlotForTask(undefined);
        }}
        onSaveTask={handleSaveTask}
        onSaveBlock={handleSaveBlock}
        language={language}
        initialSlot={initialSlotForTask}
        editingBlock={editingBlock}
        editingTask={editingTask}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={scheduleState.gridConfig}
        onSaveConfig={handleSaveGridConfig}
        language={language}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        blocks={scheduleState.blocks}
        workspaceName="SmartSchedule"
        language={language}
      />
    </div>
  );
}
