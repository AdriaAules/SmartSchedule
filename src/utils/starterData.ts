import { ScheduleBlock, SmartTask } from '../types/schedule';

export const initialTasks: SmartTask[] = [
  {
    id: 'task-1',
    title: 'Revisar prioritats de la setmana',
    type: 'flexible',
    durationMinutes: 30,
    isCompleted: true,
    priority: 'low'
  },
  {
    id: 'task-2',
    title: 'Preparar apunts per a la reunió',
    type: 'flexible',
    durationMinutes: 45,
    isCompleted: false,
    priority: 'high'
  },
  {
    id: 'task-3',
    title: 'Bloquejar temps de concentració',
    type: 'flexible',
    durationMinutes: 60,
    isCompleted: false,
    priority: 'medium'
  },
  {
    id: 'task-4',
    title: 'Planificar la propera setmana',
    type: 'punctual',
    durationMinutes: 45,
    deadline: '2026-10-02',
    isCompleted: false,
    priority: 'medium'
  },
  {
    id: 'task-5',
    title: 'Pràctiques d\'algorísmica en C',
    type: 'flexible',
    durationMinutes: 90,
    isCompleted: false,
    priority: 'high'
  },
  {
    id: 'task-6',
    title: 'Lliurament de projecte de Java',
    type: 'punctual',
    durationMinutes: 60,
    deadline: '2026-10-01',
    isCompleted: false,
    priority: 'high'
  }
];

export const initialBlocks: ScheduleBlock[] = [
  // DILLUNS (1)
  {
    id: 'block-1',
    title: 'Fonaments d\'Enginyeria',
    type: 'fixed',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 120,
    category: 'Classe Magistral',
    location: 'Aula 2.1',
    color: 'indigo',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-2',
    title: 'Càlcul Infinitesimal',
    type: 'fixed',
    dayOfWeek: 1,
    startTime: '12:00',
    endTime: '14:00',
    durationMinutes: 120,
    category: 'Teoria',
    location: 'Aula Magna',
    color: 'blue',
    isLocked: true,
    isRecurringWeekly: true
  },

  // DIMARTS (2)
  {
    id: 'block-3',
    title: 'Programació i Algorismes en C',
    type: 'fixed',
    dayOfWeek: 2,
    startTime: '10:00',
    endTime: '13:00', // 3 hores consecutives
    durationMinutes: 180,
    category: 'Laboratori',
    location: 'Lab Inf 3',
    color: 'amber',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-4',
    title: 'Física Mecànica',
    type: 'fixed',
    dayOfWeek: 2,
    startTime: '14:30',
    endTime: '16:30',
    durationMinutes: 120,
    category: 'Teoria',
    location: 'Aula 1.4',
    color: 'violet',
    isLocked: true,
    isRecurringWeekly: true
  },

  // DIMECRES (3)
  {
    id: 'block-5',
    title: 'Estructures de Dades & Java',
    type: 'fixed',
    dayOfWeek: 3,
    startTime: '08:30',
    endTime: '11:30', // 3 hores consecutives
    durationMinutes: 180,
    category: 'Classe & Lab',
    location: 'Aula 3.2',
    color: 'indigo',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-6',
    title: 'Àlgebra Lineal',
    type: 'fixed',
    dayOfWeek: 3,
    startTime: '12:00',
    endTime: '14:00',
    durationMinutes: 120,
    category: 'Teoria',
    location: 'Aula 2.1',
    color: 'blue',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-7',
    title: 'Entrenament & Gimnàs',
    type: 'flexible',
    dayOfWeek: 3,
    startTime: '16:00',
    endTime: '17:30',
    durationMinutes: 90,
    category: 'Esport',
    location: 'Gimnàs Campus',
    color: 'emerald',
    isLocked: false,
    isRecurringWeekly: true
  },

  // DIJOUS (4) - 4 hores de matemàtiques
  {
    id: 'block-8',
    title: 'Matemàtiques Aplicades & Càlcul',
    type: 'fixed',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '13:00', // 4 hores consecutives unides
    durationMinutes: 240,
    category: 'Bloc Intensiu',
    location: 'Aula 1.2',
    color: 'rose',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-9',
    title: 'Sistemes Digitals',
    type: 'fixed',
    dayOfWeek: 4,
    startTime: '14:00',
    endTime: '16:00',
    durationMinutes: 120,
    category: 'Teoria',
    location: 'Aula 2.4',
    color: 'amber',
    isLocked: true,
    isRecurringWeekly: true
  },

  // DIVENDRES (5)
  {
    id: 'block-10',
    title: 'Projectes en Equip de Programació',
    type: 'fixed',
    dayOfWeek: 5,
    startTime: '10:00',
    endTime: '13:00',
    durationMinutes: 180,
    category: 'Taller',
    location: 'Espai Co-working',
    color: 'teal',
    isLocked: true,
    isRecurringWeekly: true
  },
  {
    id: 'block-11',
    title: 'Tutoria Acadèmica',
    type: 'fixed',
    dayOfWeek: 5,
    startTime: '14:00',
    endTime: '15:00',
    durationMinutes: 60,
    category: 'Seguiment',
    location: 'Despatx 408',
    color: 'indigo',
    isLocked: true,
    isRecurringWeekly: true
  }
];
