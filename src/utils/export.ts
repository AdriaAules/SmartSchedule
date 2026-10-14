import { ScheduleBlock } from '../types/schedule';

const DAY_NAMES = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

export function exportToIcs(blocks: ScheduleBlock[], workspaceName: string = 'SmartSchedule'): void {
  // Use current week reference dates (21 to 27 September 2026 as per default mockup or dynamic)
  const baseYear = 2026;
  const baseMonth = 9; // September
  const baseDayMonday = 21;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartSchedule//EN',
    `X-WR-CALNAME:${workspaceName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const block of blocks) {
    const dayOffset = block.dayOfWeek - 1;
    const day = baseDayMonday + dayOffset;
    const [startH, startM] = block.startTime.split(':');
    const [endH, endM] = block.endTime.split(':');

    const dtStart = `${baseYear}${String(baseMonth).padStart(2, '0')}${String(day).padStart(2, '0')}T${startH}${startM}00`;
    const dtEnd = `${baseYear}${String(baseMonth).padStart(2, '0')}${String(day).padStart(2, '0')}T${endH}${endM}00`;

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:smartschedule-${block.id}@smartschedule.app`);
    icsContent.push(`DTSTAMP:${dtStart}Z`);
    icsContent.push(`DTSTART:${dtStart}`);
    icsContent.push(`DTEND:${dtEnd}`);
    icsContent.push(`SUMMARY:${block.title}`);
    if (block.location) icsContent.push(`LOCATION:${block.location}`);
    if (block.notes) icsContent.push(`DESCRIPTION:${block.notes}`);
    icsContent.push(`CATEGORIES:${block.category || block.type}`);
    icsContent.push('END:VEVENT');
  }

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workspaceName.toLowerCase().replace(/\s+/g, '_')}_schedule.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCsv(blocks: ScheduleBlock[], workspaceName: string = 'SmartSchedule'): void {
  const headers = ['Dia', 'Hora Inici', 'Hora Fi', 'Títol', 'Tipus', 'Ubicació', 'Categoria'];
  const rows = blocks.map((b) => [
    DAY_NAMES[b.dayOfWeek - 1] || `Dia ${b.dayOfWeek}`,
    b.startTime,
    b.endTime,
    `"${(b.title || '').replace(/"/g, '""')}"`,
    b.type,
    `"${(b.location || '').replace(/"/g, '""')}"`,
    `"${(b.category || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workspaceName.toLowerCase().replace(/\s+/g, '_')}_schedule.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
