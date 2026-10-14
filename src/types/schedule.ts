export type BlockType = 'fixed' | 'flexible' | 'punctual';

export interface DisplacementOrigin {
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  displacedById: string;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  type: BlockType;
  /** 1 = Monday (LUN), 2 = Tuesday (MAR), ..., 7 = Sunday (DOM) */
  dayOfWeek: number;
  /** HH:MM (e.g., "09:00") */
  startTime: string;
  /** HH:MM (e.g., "10:30") */
  endTime: string;
  durationMinutes: number;
  category?: string;
  location?: string;
  notes?: string;
  color?: string;
  deadline?: string; // For punctual tasks: YYYY-MM-DD
  isCompleted?: boolean;
  isLocked?: boolean; // Padlock lock: invariant fixed block
  isRecurringWeekly?: boolean; // Repeats every week (default true for fixed blocks)
  isAutoOptimized?: boolean;
  displacedFrom?: DisplacementOrigin;
}

export interface OptimizationResult {
  placedTasks: { task: SmartTask; block: ScheduleBlock }[];
  unplacedTasks: SmartTask[];
  recoveredMinutes: number;
  continuousFreeHoursGain: number;
  emptySlotsFound: number;
}

export interface SmartTask {
  id: string;
  title: string;
  type: 'flexible' | 'punctual';
  durationMinutes: number;
  deadline?: string; // Specific date e.g. "2026-10-02"
  isCompleted: boolean;
  scheduledBlockId?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface GridConfig {
  startHour: number; // e.g. 8 (08:00)
  endHour: number;   // e.g. 18 (18:00)
  timezone: string;  // e.g. "GMT+2"
}

export interface ScheduleState {
  blocks: ScheduleBlock[];
  tasks: SmartTask[];
  gridConfig: GridConfig;
}

export type ViewMode = 'dia' | 'semana' | 'mes';
export type Language = 'ca' | 'es' | 'en' | 'fr' | 'de';
