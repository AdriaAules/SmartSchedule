export interface ColorTheme {
  id: string;
  name: string;
  badgeBg: string;
  cardBg: string;
  cardBorder: string;
  cardText: string;
  accentBar: string;
  dotBg: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  indigo: {
    id: 'indigo',
    name: 'Índigo',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    cardBg: 'bg-indigo-50/95 hover:bg-indigo-100/90',
    cardBorder: 'border-indigo-300',
    cardText: 'text-indigo-950',
    accentBar: 'bg-indigo-600',
    dotBg: 'bg-indigo-500'
  },
  blue: {
    id: 'blue',
    name: 'Blau',
    badgeBg: 'bg-blue-100 text-blue-800',
    cardBg: 'bg-blue-50/95 hover:bg-blue-100/90',
    cardBorder: 'border-blue-300',
    cardText: 'text-blue-950',
    accentBar: 'bg-blue-600',
    dotBg: 'bg-blue-500'
  },
  emerald: {
    id: 'emerald',
    name: 'Verd maragda',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    cardBg: 'bg-emerald-50/95 hover:bg-emerald-100/90',
    cardBorder: 'border-emerald-300',
    cardText: 'text-emerald-950',
    accentBar: 'bg-emerald-600',
    dotBg: 'bg-emerald-500'
  },
  amber: {
    id: 'amber',
    name: 'Ambre',
    badgeBg: 'bg-amber-100 text-amber-800',
    cardBg: 'bg-amber-50/95 hover:bg-amber-100/90',
    cardBorder: 'border-amber-300',
    cardText: 'text-amber-950',
    accentBar: 'bg-amber-600',
    dotBg: 'bg-amber-500'
  },
  rose: {
    id: 'rose',
    name: 'Rosa',
    badgeBg: 'bg-rose-100 text-rose-800',
    cardBg: 'bg-rose-50/95 hover:bg-rose-100/90',
    cardBorder: 'border-rose-300',
    cardText: 'text-rose-950',
    accentBar: 'bg-rose-600',
    dotBg: 'bg-rose-500'
  },
  violet: {
    id: 'violet',
    name: 'Lila',
    badgeBg: 'bg-purple-100 text-purple-800',
    cardBg: 'bg-purple-50/95 hover:bg-purple-100/90',
    cardBorder: 'border-purple-300',
    cardText: 'text-purple-950',
    accentBar: 'bg-purple-600',
    dotBg: 'bg-purple-500'
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    badgeBg: 'bg-teal-100 text-teal-800',
    cardBg: 'bg-teal-50/95 hover:bg-teal-100/90',
    cardBorder: 'border-teal-300',
    cardText: 'text-teal-950',
    accentBar: 'bg-teal-600',
    dotBg: 'bg-teal-500'
  },
  slate: {
    id: 'slate',
    name: 'Gris neutre',
    badgeBg: 'bg-slate-200 text-slate-800',
    cardBg: 'bg-slate-100/90 hover:bg-slate-200/80',
    cardBorder: 'border-slate-300',
    cardText: 'text-slate-900',
    accentBar: 'bg-slate-500',
    dotBg: 'bg-slate-500'
  }
};

export function getBlockTheme(colorKey?: string, blockType?: string): ColorTheme {
  if (colorKey && COLOR_THEMES[colorKey]) {
    return COLOR_THEMES[colorKey];
  }
  if (blockType === 'flexible') return COLOR_THEMES.emerald;
  if (blockType === 'punctual') return COLOR_THEMES.rose;
  return COLOR_THEMES.indigo;
}
