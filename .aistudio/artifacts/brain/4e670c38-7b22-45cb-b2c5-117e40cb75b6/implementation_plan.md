# SmartSchedule — Intelligent Schedule Optimizer & Visual Workspace

An interactive, visual scheduling platform designed to eliminate daily schedule friction, recover lost time between commitments, and automate task placement through intelligent gap detection and visual cell optimization.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions have been incorporated from your UI mockup sketch and specifications:

- **Confirmed — Brand Identity**: Renamed to **SmartSchedule**, featuring the dark forest green calendar emblem and clean modern typography as shown in your sketch.
- **Confirmed — UI Layout & Composition (Mockup Match)**:
  - **Top Navigation Bar**: Brand logo + "SmartSchedule", current date pill ("Hoy · 23 septiembre 2026"), grid settings icon, and workspace/profile dropdown ("Marina López · Mi espacio").
  - **Left Sidebar ("Smart To-Do List")**: Task count pill badge, subtitle ("Pequeños pasos para un día más tranquilo"), "Progreso de hoy" visual progress bar with percentage, interactive task list with completed strikethrough states and time badges, "+ Añadir tarea" action button, and the "ENFOQUE SERENO" productivity coaching card.
  - **Main Calendar Header**: Large title "Tu semana" / "La teva setmana" / "Your week", week range subtitle ("21–27 de septiembre de 2026"), navigation cluster (`<`, `>`, `Hoy`), status badge ("Sin eventos programados" or active event summary), and clean view toggle pills (`Día` | `Semana` | `Mes`).
  - **Calendar Grid**: Timezone indicator column (`GMT+2`), day headers (`LUN 21`, `MAR 22`, active dark green circular badge on `MIÉ 23`, `JUE 24`, `VIE 25`, `SÁB 26`, `DOM 27`), and crisp hourly rows.
- **Confirmed — Multilingual Support**: Instant switcher between **Català (Catalan)**, **Español (Spanish)**, and **English**, with terminology fully aligned to your mockup and document.
- **Confirmed — Block Classification & 3-Subcell Engine**:
  - *Blocs fixos* (Fixed commitments): Invariant classes, practices, or meetings.
  - *Blocs buits* (Empty gaps): Dead time detected between classes or meetings.
  - *Blocs flexibles* (Flexible activities): Variable tasks like homework or workouts (User enters: name + estimated duration).
  - *Tasques puntuals* (Punctual tasks): Deadline-driven items (User enters: name + estimated duration + deadline).
  - *Cell Division Rules*: At most 3 subcells per 1-hour slot (50/50 split for 2 activities; 33/33/33 split for 3 activities; colored indicator dots for >3 activities). Hovering over any divided cell opens a floating inspector showing the exact minute breakdown.
- **Confirmed — Core Features**:
  - Intelligent optimization algorithm detecting "temps morts" and auto-scheduling pending tasks.
  - Live productivity metrics (recovered minutes, day distribution).
  - Timetable image digitization (OCR) using Gemini Vision (`gemini-3.8-flash`) to convert photos of printed timetables into editable calendar blocks.
  - Schedule comparator to detect overlaps and mutual free time between different schedules.
  - Multi-format export: iCalendar (.ics), CSV, and printable format.

---

## 1. Overview & Core Concept

### What It Does
SmartSchedule solves the universal problem of fragmented days. Rather than manually juggling to-do lists and calendar slots, users maintain their fixed schedule (classes, work shifts, meetings) and a list of flexible tasks. SmartSchedule's optimization algorithm detects awkward empty gaps ("temps morts") and neatly nests pending tasks into optimal slots, maximizing uninterrupted blocks of deep focus and free personal time.

### Target Audience
University students, freelancers, and small teams with variable schedules who need to turn a scattered to-do list into a coherent, balanced weekly plan.

### Key Value
- **Zero Mental Friction**: Eliminate the daily cognitive load of asking "when should I do this?".
- **Visual Elegance & Clarity**: A calm, distraction-free interface matching your sketch, with proportional subcell splitting and hover details.
- **Physical-to-Digital Bridge**: Snap a picture of a university notice board or screenshot of a timetable to auto-populate the calendar via Gemini Vision.
- **Schedule Synergy**: Compare your schedule with classmates or colleagues to immediately pinpoint mutual free hours.

---

## 2. User Experience & Visual Design

### Key User Flows

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  SmartSchedule User Journey                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LAND & EXPLORE ────────► 2. MANAGE TO-DOS ────────► 3. SMART OPTIMIZE   │
│     View weekly grid         Add tasks in sidebar      Click "Optimitzar"    │
│     (Preloaded Uni demo      (Duration & deadline)     to fill dead gaps     │
│      matching mockup)                                  with flexible tasks   │
│                                                                              │
│                                      │                                       │
│                                      ▼                                       │
│                                                                              │
│  4. HOVER & ADJUST ────────► 5. SCAN TIMETABLE ───────► 6. EXPORT / SHARE   │
│     Inspect 1/2/3 subcells    Upload photo of schedule  Download .ics/CSV    │
│     with popover details     Gemini converts to blocks Compare schedules     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. **Dashboard & Weekly View**:
   - The user opens SmartSchedule and sees the clean, serene workspace from your sketch: the left "Smart To-Do List" sidebar and the central weekly grid.
   - The current week (21–27 September 2026, or current date) displays Monday to Sunday with `GMT+2`.
   - The active day (`MIÉ 23`) is prominently highlighted with a dark forest green badge.

2. **Smart To-Do Sidebar**:
   - Displays task count badge, daily completion percentage (`25%` with a smooth green progress bar), and task cards.
   - Checking a task marks it complete with an animated strikethrough and updates the progress indicator.
   - Clicking `+ Añadir tarea` opens a quick modal with two clear paths:
     - **Tasca Flexible**: Name + Estimated Duration (e.g. 45m, 1h, 1h 30m).
     - **Tasca Puntual**: Name + Duration + Deadline date.
   - The bottom of the sidebar features the gentle productivity coaching card ("ENFOQUE SERENO").

3. **Smart Optimization Algorithm ("Optimitzar Horari")**:
   - Clicking the smart optimization trigger scans the week's timetable for all "temps morts" (empty gaps between fixed blocks).
   - The algorithm sorts pending tasks by deadline urgency and duration, packing them greedily into matching empty slots.
   - The user sees an interactive banner showing the total **recovered minutes** (e.g. "+120 minuts aprofitats!") and the newly scheduled blocks highlighted.

4. **Visual Subcell Division & Hover Inspector**:
   - Single task in 1 hour: Fills the cell with a rounded block.
   - 2 tasks in 1 hour: Divides 50/50 vertically.
   - 3 tasks in 1 hour: Divides 33/33/33 vertically.
   - More than 3 tasks: Displays top tasks and color indicator dots at the bottom.
   - **Hover Inspector**: Hovering over any cell reveals a clean popover with the exact start and end time of each sub-block, category badge, and quick edit/delete actions.

5. **Timetable Digitization via Gemini Vision (OCR)**:
   - Clicking the OCR button opens an image dropzone.
   - Users can drag and drop an image of an academic timetable or choose from preloaded realistic student schedules.
   - The Express backend calls Gemini 3.8 Flash, extracting course names, days, and hours into structured JSON and placing them as **Fixed Blocks**.

6. **Schedule Comparator & Workspaces**:
   - Switch between workspaces (e.g. *Grau Enginyeria*, *Feina / Freelance*, *Personal*).
   - "Comparar horaris" mode allows overlaying two schedules to find overlapping free windows for study groups or meetings.

7. **Export & Grid Customization**:
   - Export to **iCalendar (.ics)** (imports into Google Calendar, Apple Calendar, Outlook).
   - Export to **CSV** or print-ready layout.
   - Grid bounds setting allows changing starting/ending hours (e.g. `08:00 - 18:00` or `07:00 - 22:00`).

---

### Visual Identity & Theme

- **Palette**:
  - *Primary Accent*: Dark Forest Green (`#1b4332` / `#2d6a4f`) for active badges, brand logo, and key highlights.
  - *Secondary / Sage*: Soft Mint Sage (`#e9f5ee` / `#d8f3dc`) for progress bars, tip backgrounds, and calm status tags.
  - *Surface Canvas*: Pristine warm white and neutral slate (`#fcfdfd` / `#f8fafc`) with subtle borders (`#e2e8f0`).
  - *Block Badges*:
    - Fixed classes/meetings: Cool slate/indigo tint (`bg-indigo-50 text-indigo-700 border-indigo-200`).
    - Flexible tasks: Fresh emerald tint (`bg-emerald-50 text-emerald-700 border-emerald-200`).
    - Punctual deadlines: Amber/terracotta tint (`bg-amber-50 text-amber-700 border-amber-200`).
- **Typography**: Clean, friendly modern sans font (`Inter` / `Plus Jakarta Sans`) with `tabular-nums font-mono` for all timestamps, time labels (`08:00`, `09:00`), and metrics.
- **Layout Rhythm**: Exact alignment with the provided screenshot: fixed-width left sidebar (300px), flexible right calendar area with rounded container borders, and clean pill navigation.

---

## 3. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SmartSchedule Frontend                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Top Header: Logo, Date Pill, Grid Settings, Workspace/Profile Dropdown │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │    Smart To-Do Sidebar    │  │       Main Interactive Calendar        │  │
│  │  - Task count & subtitle  │  │  - Header: View toggle, Date, Nav      │  │
│  │  - "Progreso de hoy" bar  │  │  - Grid: GMT+2, Day columns, Hours     │  │
│  │  - Checkable task items   │  │  - 1/2/3 Proportional Subcells         │  │
│  │  - "+ Añadir tarea" modal │  │  - Hover Popover breakdown             │  │
│  │  - "ENFOQUE SERENO" card  │  │  - Schedule Comparator Mode            │  │
│  │  - "Smart Optimize" CTA   │  │  - Productivity Metrics counter        │  │
│  └───────────────────────────┘  └────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ App State (Active Workspace, Blocks, Tasks, Language: CA/ES/EN)       │  │
│  │ Synchronized to LocalStorage                                          │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│     Client Export Engine      │     │  Express Server (/api/ocr-schedule)   │
│ - iCal (.ics) Download        │     ├───────────────────────────────────────┤
│ - CSV Exporter                │     │ - Gemini 3.8 Flash Vision             │
│ - Printable Schedule View     │     │ - Structured JSON Schema Extractor    │
└───────────────────────────────┘     └───────────────────────────────────────┘
```

### Core Data Models

```typescript
export type BlockType = 'fixed' | 'flexible' | 'punctual';

export interface ScheduleBlock {
  id: string;
  title: string;
  type: BlockType;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ... 6 = Sat
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  durationMinutes: number;
  category?: string;
  notes?: string;
  color?: string;
  deadline?: string;
  isCompleted?: boolean;
}

export interface SmartTask {
  id: string;
  title: string;
  type: 'flexible' | 'punctual';
  durationMinutes: number;
  deadline?: string;
  isCompleted: boolean;
  scheduledBlockId?: string;
  timeLabel?: string; // e.g. "Hoy · 10:30"
}

export interface Workspace {
  id: string;
  name: string;
  userName: string;
  avatarLabel: string;
  blocks: ScheduleBlock[];
  tasks: SmartTask[];
  gridConfig: {
    startHour: number; // e.g. 8 (08:00)
    endHour: number;   // e.g. 18 (18:00)
  };
}
```

---

## 4. Implementation Steps

1. **Step 1: Application Shell, Theme & Translations**
   - Configure Tailwind styling with the exact forest green, sage, and clean border palette from the sketch.
   - Implement trilingual support (Catalan, Spanish, English) with instant toggle in the header.
   - Preload starter university workspace ("Marina López · Mi espacio").

2. **Step 2: Smart To-Do Sidebar & Coaching Card**
   - Build the left sidebar with task count, daily progress bar, and checkable task items.
   - Implement "+ Añadir tarea" modal supporting Flexible (name, duration) and Punctual (name, duration, deadline) tasks.
   - Add the "ENFOQUE SERENO" productivity coaching card and "Optimitzar Horari" trigger.

3. **Step 3: Interactive Calendar Grid with 3-Subcell Splitting & Hover Details**
   - Build the calendar grid matching the mockup: `GMT+2` column, `LUN 21` through `DOM 27` headers with active green badge on today.
   - Implement the subcell splitting logic: 1 task (full), 2 tasks (50/50), 3 tasks (33/33/33), and indicator dots for >3.
   - Build the floating hover popover showing exact task intervals and details.
   - Implement Day, Week, and Month view modes.

4. **Step 4: Smart Optimization Algorithm & Productivity Metrics**
   - Implement dead-gap detection between fixed commitments.
   - Greedy interval-packing engine to automatically slot pending tasks into optimal gaps.
   - Productivity metrics counter displaying recovered minutes and efficiency score.

5. **Step 5: Schedule Comparator & Multi-Workspace Support**
   - Workspace switcher to manage multiple schedules (academic, freelance, personal).
   - Comparison view highlighting overlapping availability for team study or meetings.

6. **Step 6: Timetable Digitization (OCR) with Gemini Vision**
   - Express server endpoint `/api/ocr-schedule` calling Gemini 3.8 Flash with structured JSON timetable extraction.
   - Client image upload dialog with drag-and-drop and preloaded sample timetable images for instant testing.

7. **Step 7: iCal / CSV / Print Export & Final Polish**
   - Standard `.ics` iCalendar file export and CSV export.
   - Grid start/end hour adjustment dialog.
   - Final verification with `compile_applet`.
