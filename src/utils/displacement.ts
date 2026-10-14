import { ScheduleBlock } from '../types/schedule';
import { timeToMinutes, minutesToTime } from './optimizer';

export interface DisplacementResult {
  success: boolean;
  blocks: ScheduleBlock[];
  errorMessage?: string;
}

/**
 * Checks whether a block is fixed (closed padlock) or flexible (open green padlock).
 * If isLocked is explicitly set, it is the absolute authority.
 * Otherwise, falls back to type === 'fixed'.
 */
export function isBlockFixed(b: { isLocked?: boolean; type: string }): boolean {
  if (typeof b.isLocked === 'boolean') {
    return b.isLocked;
  }
  return b.type === 'fixed';
}

/**
 * Checks if two time intervals [s1, e1] and [s2, e2] strictly overlap.
 * Adjacent touching blocks [8:00, 10:00] and [10:00, 12:00] do NOT overlap.
 */
export function intervalsOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Iteratively restores any flexible blocks that were displaced by `removedBlockId`
 * back to their original slots, provided those original slots are currently free.
 * Includes cascading resolution when multiple sequential blocks were displaced.
 */
export function revertDisplacedBlocks(
  blocks: ScheduleBlock[],
  removedBlockId: string
): ScheduleBlock[] {
  let result = blocks.map((b) => ({ ...b }));
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 25) {
    changed = false;
    iterations++;

    for (let i = 0; i < result.length; i++) {
      const b = result[i];
      if (b.displacedFrom && b.displacedFrom.displacedById === removedBlockId) {
        const origStart = timeToMinutes(b.displacedFrom.startTime);
        const origEnd = timeToMinutes(b.displacedFrom.endTime);
        const targetDay = b.displacedFrom.dayOfWeek;

        // Check if the original slot [origStart, origEnd] on targetDay is free
        const hasCollision = result.some((other) => {
          if (other.id === b.id || other.id === removedBlockId) return false;
          if (other.dayOfWeek !== targetDay) return false;
          const s = timeToMinutes(other.startTime);
          const e = timeToMinutes(other.endTime);
          return intervalsOverlap(origStart, origEnd, s, e);
        });

        if (!hasCollision) {
          result[i] = {
            ...b,
            dayOfWeek: targetDay,
            startTime: b.displacedFrom.startTime,
            endTime: b.displacedFrom.endTime,
            displacedFrom: undefined
          };
          changed = true;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Places or moves an activity into a day and start time,
 * automatically cascading and displacing flexible (open padlock) activities
 * either DOWN (later in the day) or UP (earlier in the day) to make room.
 *
 * It tracks displaced positions in `displacedFrom` so they can dynamically snap back
 * if the displacing activity is removed or moved away.
 *
 * Fixed (locked) blocks are strictly IMMUTABLE: they will never move, and no
 * other block can occupy their time.
 */
export function placeBlockWithDisplacement(
  allBlocks: ScheduleBlock[],
  blockToPlace: ScheduleBlock,
  targetDay: number,
  targetStartMins: number,
  startBoundHour: number = 8,
  endBoundHour: number = 20
): DisplacementResult {
  const duration = blockToPlace.durationMinutes || 60;
  const targetStart = targetStartMins;
  const targetEnd = targetStart + duration;
  const dayStart = startBoundHour * 60;
  const dayEnd = endBoundHour * 60;

  // 1. Boundary check: target block must fit inside day bounds
  if (targetStart < dayStart || targetEnd > dayEnd) {
    return {
      success: false,
      blocks: allBlocks,
      errorMessage: `L'activitat sobrepassa els límits de l'horari (${startBoundHour}:00 a ${endBoundHour}:00).`
    };
  }

  const placedBlock: ScheduleBlock = {
    ...blockToPlace,
    dayOfWeek: targetDay,
    startTime: minutesToTime(targetStart),
    endTime: minutesToTime(targetEnd),
    displacedFrom: undefined // Target block is placed where user requested
  };

  // Blocks on other days
  const otherDayBlocks = allBlocks.filter(
    (b) => b.id !== blockToPlace.id && b.dayOfWeek !== targetDay
  );

  // Blocks on target day (excluding the block being placed)
  const targetDayBlocks = allBlocks.filter(
    (b) => b.id !== blockToPlace.id && b.dayOfWeek === targetDay
  );

  const fixedBlocks = targetDayBlocks.filter(isBlockFixed);
  const flexibleBlocks = targetDayBlocks.filter((b) => !isBlockFixed(b));

  // 2. Target block must NOT overlap with any immutable fixed block
  for (const fix of fixedBlocks) {
    const fStart = timeToMinutes(fix.startTime);
    const fEnd = timeToMinutes(fix.endTime);
    if (intervalsOverlap(targetStart, targetEnd, fStart, fEnd)) {
      return {
        success: false,
        blocks: allBlocks,
        errorMessage: `Aquesta franja coincideix amb una classe o bloc fix invariable (${fix.title}).`
      };
    }
  }

  // 3. If there are no flexible blocks on this day, place directly
  if (flexibleBlocks.length === 0) {
    return {
      success: true,
      blocks: [...otherDayBlocks, ...fixedBlocks, placedBlock]
    };
  }

  // Check if target block overlaps with any flexible block
  const hasCollision = flexibleBlocks.some((flex) => {
    const s = timeToMinutes(flex.startTime);
    const e = timeToMinutes(flex.endTime);
    return intervalsOverlap(targetStart, targetEnd, s, e);
  });

  if (!hasCollision) {
    return {
      success: true,
      blocks: [...otherDayBlocks, ...fixedBlocks, ...flexibleBlocks, placedBlock]
    };
  }

  // Helper to check if a block collides with ANY fixed block
  const collidesWithAnyFixed = (s: number, e: number) => {
    return fixedBlocks.some((fix) => {
      const fStart = timeToMinutes(fix.startTime);
      const fEnd = timeToMinutes(fix.endTime);
      return intervalsOverlap(s, e, fStart, fEnd);
    });
  };

  // 4. STRATEGY 1: Push Downward (Cap avall)
  const tryDownward = (): { success: boolean; result: ScheduleBlock[]; cost: number } => {
    const sorted = [...flexibleBlocks].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const placedFlex: ScheduleBlock[] = [];
    let totalShift = 0;

    for (const flex of sorted) {
      const origStart = timeToMinutes(flex.startTime);
      const dur = flex.durationMinutes || 60;
      let curStart = origStart;
      let curEnd = curStart + dur;

      // If it overlaps the newly placed block, push it past placedBlock
      if (intervalsOverlap(curStart, curEnd, targetStart, targetEnd)) {
        curStart = targetEnd;
        curEnd = curStart + dur;
      }

      // If it overlaps any already placed flexible block, push it past it
      for (const prev of placedFlex) {
        const pEnd = timeToMinutes(prev.endTime);
        if (curStart < pEnd) {
          curStart = pEnd;
          curEnd = curStart + dur;
        }
      }

      // Push past any fixed block collision
      let attempts = 0;
      while (collidesWithAnyFixed(curStart, curEnd) && attempts < 10) {
        attempts++;
        for (const fix of fixedBlocks) {
          const fStart = timeToMinutes(fix.startTime);
          const fEnd = timeToMinutes(fix.endTime);
          if (intervalsOverlap(curStart, curEnd, fStart, fEnd)) {
            curStart = fEnd;
            curEnd = curStart + dur;
          }
        }
      }

      if (curEnd > dayEnd || collidesWithAnyFixed(curStart, curEnd)) {
        return { success: false, result: [], cost: Infinity };
      }

      const isShifted = curStart !== origStart;
      const displacedFrom = isShifted
        ? {
            dayOfWeek: flex.displacedFrom?.dayOfWeek ?? targetDay,
            startTime: flex.displacedFrom?.startTime ?? flex.startTime,
            endTime: flex.displacedFrom?.endTime ?? flex.endTime,
            displacedById: blockToPlace.id
          }
        : flex.displacedFrom;

      totalShift += Math.abs(curStart - origStart);
      placedFlex.push({
        ...flex,
        startTime: minutesToTime(curStart),
        endTime: minutesToTime(curEnd),
        displacedFrom
      });
    }

    return { success: true, result: placedFlex, cost: totalShift };
  };

  // 5. STRATEGY 2: Push Upward (Cap a dalt)
  const tryUpward = (): { success: boolean; result: ScheduleBlock[]; cost: number } => {
    const sorted = [...flexibleBlocks].sort(
      (a, b) => timeToMinutes(b.startTime) - timeToMinutes(a.startTime)
    );

    const placedFlex: ScheduleBlock[] = [];
    let totalShift = 0;

    for (const flex of sorted) {
      const origStart = timeToMinutes(flex.startTime);
      const dur = flex.durationMinutes || 60;
      let curStart = origStart;
      let curEnd = curStart + dur;

      // If it overlaps target block, push it before placedBlock
      if (intervalsOverlap(curStart, curEnd, targetStart, targetEnd)) {
        curEnd = targetStart;
        curStart = curEnd - dur;
      }

      // If it overlaps previously placed flexible blocks (which are positioned below it)
      for (const prev of placedFlex) {
        const pStart = timeToMinutes(prev.startTime);
        if (curEnd > pStart) {
          curEnd = pStart;
          curStart = curEnd - dur;
        }
      }

      // Push before any fixed block collision
      let attempts = 0;
      while (collidesWithAnyFixed(curStart, curEnd) && attempts < 10) {
        attempts++;
        for (const fix of fixedBlocks) {
          const fStart = timeToMinutes(fix.startTime);
          const fEnd = timeToMinutes(fix.endTime);
          if (intervalsOverlap(curStart, curEnd, fStart, fEnd)) {
            curEnd = fStart;
            curStart = curEnd - dur;
          }
        }
      }

      if (curStart < dayStart || collidesWithAnyFixed(curStart, curEnd)) {
        return { success: false, result: [], cost: Infinity };
      }

      const isShifted = curStart !== origStart;
      const displacedFrom = isShifted
        ? {
            dayOfWeek: flex.displacedFrom?.dayOfWeek ?? targetDay,
            startTime: flex.displacedFrom?.startTime ?? flex.startTime,
            endTime: flex.displacedFrom?.endTime ?? flex.endTime,
            displacedById: blockToPlace.id
          }
        : flex.displacedFrom;

      totalShift += Math.abs(curStart - origStart);
      placedFlex.push({
        ...flex,
        startTime: minutesToTime(curStart),
        endTime: minutesToTime(curEnd),
        displacedFrom
      });
    }

    return { success: true, result: placedFlex, cost: totalShift };
  };

  // 6. STRATEGY 3: Hybrid (Blocks before target shift up, blocks after target shift down)
  const tryHybrid = (): { success: boolean; result: ScheduleBlock[]; cost: number } => {
    const midpoint = (targetStart + targetEnd) / 2;

    const shiftUpGroup = flexibleBlocks
      .filter((b) => (timeToMinutes(b.startTime) + timeToMinutes(b.endTime)) / 2 <= midpoint)
      .sort((a, b) => timeToMinutes(b.startTime) - timeToMinutes(a.startTime));

    const shiftDownGroup = flexibleBlocks
      .filter((b) => (timeToMinutes(b.startTime) + timeToMinutes(b.endTime)) / 2 > midpoint)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const placedFlex: ScheduleBlock[] = [];
    let totalShift = 0;

    // Shift upper group upwards
    for (const flex of shiftUpGroup) {
      const origStart = timeToMinutes(flex.startTime);
      const dur = flex.durationMinutes || 60;
      let curStart = origStart;
      let curEnd = curStart + dur;

      if (intervalsOverlap(curStart, curEnd, targetStart, targetEnd)) {
        curEnd = targetStart;
        curStart = curEnd - dur;
      }

      for (const prev of placedFlex) {
        const pStart = timeToMinutes(prev.startTime);
        if (curEnd > pStart) {
          curEnd = pStart;
          curStart = curEnd - dur;
        }
      }

      let attempts = 0;
      while (collidesWithAnyFixed(curStart, curEnd) && attempts < 10) {
        attempts++;
        for (const fix of fixedBlocks) {
          const fStart = timeToMinutes(fix.startTime);
          const fEnd = timeToMinutes(fix.endTime);
          if (intervalsOverlap(curStart, curEnd, fStart, fEnd)) {
            curEnd = fStart;
            curStart = curEnd - dur;
          }
        }
      }

      if (curStart < dayStart || collidesWithAnyFixed(curStart, curEnd)) {
        return { success: false, result: [], cost: Infinity };
      }

      const isShifted = curStart !== origStart;
      const displacedFrom = isShifted
        ? {
            dayOfWeek: flex.displacedFrom?.dayOfWeek ?? targetDay,
            startTime: flex.displacedFrom?.startTime ?? flex.startTime,
            endTime: flex.displacedFrom?.endTime ?? flex.endTime,
            displacedById: blockToPlace.id
          }
        : flex.displacedFrom;

      totalShift += Math.abs(curStart - origStart);
      placedFlex.push({
        ...flex,
        startTime: minutesToTime(curStart),
        endTime: minutesToTime(curEnd),
        displacedFrom
      });
    }

    // Shift lower group downwards
    for (const flex of shiftDownGroup) {
      const origStart = timeToMinutes(flex.startTime);
      const dur = flex.durationMinutes || 60;
      let curStart = origStart;
      let curEnd = curStart + dur;

      if (intervalsOverlap(curStart, curEnd, targetStart, targetEnd)) {
        curStart = targetEnd;
        curEnd = curStart + dur;
      }

      for (const prev of placedFlex) {
        const pEnd = timeToMinutes(prev.endTime);
        if (curStart < pEnd) {
          curStart = pEnd;
          curEnd = curStart + dur;
        }
      }

      let attempts = 0;
      while (collidesWithAnyFixed(curStart, curEnd) && attempts < 10) {
        attempts++;
        for (const fix of fixedBlocks) {
          const fStart = timeToMinutes(fix.startTime);
          const fEnd = timeToMinutes(fix.endTime);
          if (intervalsOverlap(curStart, curEnd, fStart, fEnd)) {
            curEnd = fEnd;
            curEnd = curStart + dur;
          }
        }
      }

      if (curEnd > dayEnd || collidesWithAnyFixed(curStart, curEnd)) {
        return { success: false, result: [], cost: Infinity };
      }

      const isShifted = curStart !== origStart;
      const displacedFrom = isShifted
        ? {
            dayOfWeek: flex.displacedFrom?.dayOfWeek ?? targetDay,
            startTime: flex.displacedFrom?.startTime ?? flex.startTime,
            endTime: flex.displacedFrom?.endTime ?? flex.endTime,
            displacedById: blockToPlace.id
          }
        : flex.displacedFrom;

      totalShift += Math.abs(curStart - origStart);
      placedFlex.push({
        ...flex,
        startTime: minutesToTime(curStart),
        endTime: minutesToTime(curEnd),
        displacedFrom
      });
    }

    return { success: true, result: placedFlex, cost: totalShift };
  };

  const downResult = tryDownward();
  const upResult = tryUpward();
  const hybridResult = tryHybrid();

  const candidates = [downResult, upResult, hybridResult].filter((c) => c.success);

  if (candidates.length === 0) {
    return {
      success: false,
      blocks: allBlocks,
      errorMessage: 'No hi ha prou espai lliure ni a dalt ni a baix per desplaçar les activitats flexibles.'
    };
  }

  // Pick the strategy that caused the least total movement (most optimal and natural)
  candidates.sort((a, b) => a.cost - b.cost);
  const best = candidates[0];

  return {
    success: true,
    blocks: [...otherDayBlocks, ...fixedBlocks, ...best.result, placedBlock]
  };
}
