import { ScheduleBlock, SmartTask, OptimizationResult } from '../types/schedule';

/**
 * Converts "HH:MM" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to "HH:MM"
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface TimeSlot {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
}

/**
 * Finds all empty gaps ("temps morts") in the schedule between startHour and endHour
 */
export function findEmptySlots(
  blocks: ScheduleBlock[],
  startHour: number,
  endHour: number,
  daysToScan: number[] = [1, 2, 3, 4, 5] // Monday through Friday by default
): TimeSlot[] {
  const emptySlots: TimeSlot[] = [];
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;

  for (const day of daysToScan) {
    // Get all blocks for this day, sorted by start time
    const dayBlocks = blocks
      .filter((b) => b.dayOfWeek === day)
      .map((b) => ({
        start: timeToMinutes(b.startTime),
        end: timeToMinutes(b.endTime),
        title: b.title
      }))
      .sort((a, b) => a.start - b.start);

    // Merge overlapping blocks if any
    const mergedBlocks: { start: number; end: number }[] = [];
    for (const b of dayBlocks) {
      if (!mergedBlocks.length) {
        mergedBlocks.push({ start: b.start, end: b.end });
      } else {
        const last = mergedBlocks[mergedBlocks.length - 1];
        if (b.start <= last.end) {
          last.end = Math.max(last.end, b.end);
        } else {
          mergedBlocks.push({ start: b.start, end: b.end });
        }
      }
    }

    // Gaps between day bounds and blocks
    let currentPointer = dayStartMinutes;

    for (const block of mergedBlocks) {
      // If block starts within or after bounds
      const blockStart = Math.max(dayStartMinutes, block.start);
      const blockEnd = Math.min(dayEndMinutes, block.end);

      if (blockStart > currentPointer) {
        const gapDuration = blockStart - currentPointer;
        // Only count gaps of at least 20 minutes
        if (gapDuration >= 20) {
          emptySlots.push({
            dayOfWeek: day,
            startMinutes: currentPointer,
            endMinutes: blockStart,
            durationMinutes: gapDuration
          });
        }
      }
      currentPointer = Math.max(currentPointer, blockEnd);
    }

    // Trailing gap until dayEndMinutes
    if (currentPointer < dayEndMinutes) {
      const gapDuration = dayEndMinutes - currentPointer;
      if (gapDuration >= 20) {
        emptySlots.push({
          dayOfWeek: day,
          startMinutes: currentPointer,
          endMinutes: dayEndMinutes,
          durationMinutes: gapDuration
        });
      }
    }
  }

  return emptySlots;
}

/**
 * Intelligent optimization algorithm:
 * - Detects inefficiencies ("temps morts")
 * - Sorts pending tasks by priority and duration
 * - Clusters tasks into gaps to preserve continuous blocks of deep free time
 */
export function optimizeSchedule(
  existingBlocks: ScheduleBlock[],
  tasks: SmartTask[],
  startHour: number,
  endHour: number
): OptimizationResult {
  // Pending uncompleted tasks that are not yet scheduled
  const unplaced = tasks.filter((t) => !t.isCompleted && !t.scheduledBlockId);
  if (unplaced.length === 0) {
    return {
      placedTasks: [],
      unplacedTasks: [],
      recoveredMinutes: 0,
      continuousFreeHoursGain: 0,
      emptySlotsFound: 0
    };
  }

  // Sort tasks: high priority first, then deadline urgency, then longer tasks
  const sortedTasks = [...unplaced].sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const pA = priorityWeight[a.priority || 'medium'];
    const pB = priorityWeight[b.priority || 'medium'];
    if (pA !== pB) return pB - pA;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.durationMinutes - a.durationMinutes;
  });

  // Find empty slots
  const availableSlots = findEmptySlots(existingBlocks, startHour, endHour);
  const placedTasks: { task: SmartTask; block: ScheduleBlock }[] = [];
  const remainingTasks: SmartTask[] = [];

  let totalRecoveredMins = 0;

  // Track remaining space in each slot
  const mutableSlots = availableSlots.map((s) => ({
    ...s,
    currentStart: s.startMinutes,
    remainingMins: s.durationMinutes
  }));

  for (const task of sortedTasks) {
    let placed = false;

    // Preference: cluster adjacent to existing commitments to leave big contiguous free blocks
    for (const slot of mutableSlots) {
      if (slot.remainingMins >= task.durationMinutes) {
        const startMins = slot.currentStart;
        const endMins = startMins + task.durationMinutes;

        const newBlock: ScheduleBlock = {
          id: `opt-${task.id}-${Date.now()}`,
          title: task.title,
          type: task.type,
          dayOfWeek: slot.dayOfWeek,
          startTime: minutesToTime(startMins),
          endTime: minutesToTime(endMins),
          durationMinutes: task.durationMinutes,
          category: task.type === 'punctual' ? 'Tasca Puntual' : 'Bloc Flexible',
          color: task.type === 'punctual' ? 'amber' : 'emerald',
          deadline: task.deadline,
          isAutoOptimized: true
        };

        placedTasks.push({ task, block: newBlock });
        slot.currentStart = endMins;
        slot.remainingMins -= task.durationMinutes;
        totalRecoveredMins += task.durationMinutes;
        placed = true;
        break;
      }
    }

    if (!placed) {
      remainingTasks.push(task);
    }
  }

  return {
    placedTasks,
    unplacedTasks: remainingTasks,
    recoveredMinutes: totalRecoveredMins,
    continuousFreeHoursGain: Math.round((totalRecoveredMins / 60) * 10) / 10,
    emptySlotsFound: availableSlots.length
  };
}
