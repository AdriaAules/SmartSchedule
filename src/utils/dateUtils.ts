import { Language } from '../types/schedule';

/**
 * Returns a new Date corresponding to the Monday of the week for given date
 */
export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a Date into a local 'YYYY-MM-DD' string without UTC timezone shift
 */
export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DayInfo {
  date: Date;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  dayNumber: number;
  monthNumber: number;
  year: number;
  isToday: boolean;
  dateKey: string; // YYYY-MM-DD
}

const LOCALES: Record<Language, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE'
};

/**
 * Returns the 7 days of the week containing anchorDate
 */
export function getWeekDays(
  anchorDate: Date,
  lang: Language = 'ca'
): {
  days: DayInfo[];
  weekLabel: string;
} {
  const monday = getMonday(anchorDate);
  const days: DayInfo[] = [];
  const todayStr = new Date().toDateString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    days.push({
      date: d,
      dayOfWeek: i + 1,
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
      year: d.getFullYear(),
      isToday: d.toDateString() === todayStr,
      dateKey: formatDateKey(d)
    });
  }

  const startD = days[0].date;
  const endD = days[6].date;
  const year = endD.getFullYear();
  const locale = LOCALES[lang] || 'ca-ES';
  const startMonth = startD.toLocaleString(locale, { month: 'long' });
  const endMonth = endD.toLocaleString(locale, { month: 'long' });

  let weekLabel = '';
  if (startD.getMonth() === endD.getMonth()) {
    weekLabel = `${startD.getDate()}–${endD.getDate()} de ${endMonth} de ${year}`;
  } else {
    weekLabel = `${startD.getDate()} ${startMonth} – ${endD.getDate()} ${endMonth} de ${year}`;
  }

  return { days, weekLabel };
}

export interface MonthCell {
  date: Date;
  dayNumber: number;
  dayOfWeek: number; // 1 = Mon ... 7 = Sun
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string;
}

/**
 * Computes exact real calendar month grid with real leap years, correct day counts, and padding
 */
export function getRealMonthCalendar(
  anchorDate: Date,
  lang: Language = 'ca'
): {
  monthName: string;
  year: number;
  cells: MonthCell[];
} {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth(); // 0 to 11

  const todayStr = new Date().toDateString();

  // First day of current month
  const firstDay = new Date(year, month, 1);
  // Total days in current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  // Day of week of the 1st: 0 (Sun) to 6 (Sat). In our 1=Mon..7=Sun standard:
  const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay(); // 1 = Mon ... 7 = Sun
  const prevMonthPaddingCount = firstDayOfWeek - 1;

  const cells: MonthCell[] = [];

  // 1. Previous month padding days
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  for (let i = prevMonthPaddingCount - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({
      date: d,
      dayNumber: d.getDate(),
      dayOfWeek: d.getDay() === 0 ? 7 : d.getDay(),
      isCurrentMonth: false,
      isToday: d.toDateString() === todayStr,
      dateKey: formatDateKey(d)
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({
      date: d,
      dayNumber: day,
      dayOfWeek: d.getDay() === 0 ? 7 : d.getDay(),
      isCurrentMonth: true,
      isToday: d.toDateString() === todayStr,
      dateKey: formatDateKey(d)
    });
  }

  // 3. Next month padding days to complete multiple of 7 (usually 35 or 42 cells)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    cells.push({
      date: d,
      dayNumber: day,
      dayOfWeek: d.getDay() === 0 ? 7 : d.getDay(),
      isCurrentMonth: false,
      isToday: d.toDateString() === todayStr,
      dateKey: formatDateKey(d)
    });
  }

  const locale = LOCALES[lang] || 'ca-ES';
  const monthName = anchorDate.toLocaleString(locale, { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return {
    monthName: `${capitalizedMonth} ${year}`,
    year,
    cells
  };
}

export function formatHeaderDate(date: Date, lang: Language): string {
  const locale = LOCALES[lang] || 'ca-ES';
  const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: 'long' });
  const year = date.getFullYear();

  if (lang === 'en') {
    return `${capitalizedWeekday}, ${month} ${day}, ${year}`;
  }
  if (lang === 'de') {
    return `${capitalizedWeekday}, ${day}. ${month} ${year}`;
  }
  return `${capitalizedWeekday}, ${day} ${month} ${year}`;
}
