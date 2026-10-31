import type {
  ChartPoint,
  ChartRange,
  FocusColor,
  FocusMode,
  FocusSession,
  ModeTotal,
} from './models';

export const FOCUS_SECONDS = 20 * 60;
export const BREAK_SECONDS = 20;
export const SESSION_MINUTES = 20;
export const MAX_FOCUS_MODES = 3;
export const LANDING_SECONDS = 5;

export const DEFAULT_FOCUS_MODES: FocusMode[] = [
  { id: 'work', label: 'Work', color: 'work' },
  { id: 'study', label: 'Study', color: 'study' },
  { id: 'creative', label: 'Creative', color: 'creative' },
];

export const FOCUS_COLORS: FocusColor[] = ['work', 'study', 'creative'];

export const EYE_TIPS = [
  'Let your eyes settle on the farthest thing you can see.',
  'Blink slowly a few times to refresh tired eyes.',
  'Keep your screen just below eye level when you can.',
  'Natural daylight helps your eyes shift focus more comfortably.',
  'Relax your shoulders while you look into the distance.',
] as const;

const chartLocale = 'en-US';

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ''}`;
}

export function sessionMinutes(session: FocusSession): number {
  return Number.isFinite(session.focusMinutes) && session.focusMinutes > 0
    ? session.focusMinutes
    : SESSION_MINUTES;
}

export function totalFocusMinutes(sessions: FocusSession[]): number {
  return sessions.reduce((total, session) => total + sessionMinutes(session), 0);
}

export function todayFocusMinutes(sessions: FocusSession[], now = new Date()): number {
  const todayKey = localDayKey(now);
  return sessions
    .filter((session) => localDayKey(new Date(session.endedAt)) === todayKey)
    .reduce((total, session) => total + sessionMinutes(session), 0);
}

export function modeTotals(sessions: FocusSession[], focusModes: FocusMode[]): ModeTotal[] {
  const totals = new Map<string, ModeTotal>();

  sessions.forEach((session) => {
    const currentMode = focusModes.find((mode) => mode.id === session.modeId);
    const existing = totals.get(session.modeId);
    totals.set(session.modeId, {
      id: session.modeId,
      label: currentMode?.label || session.modeLabel,
      color: currentMode?.color || session.modeColor,
      minutes: (existing?.minutes ?? 0) + sessionMinutes(session),
    });
  });

  focusModes.forEach((mode) => {
    if (!totals.has(mode.id)) {
      totals.set(mode.id, {
        id: mode.id,
        label: mode.label,
        color: mode.color,
        minutes: 0,
      });
    }
  });

  return Array.from(totals.values());
}

export function buildChartData(
  sessions: FocusSession[],
  range: ChartRange,
  now = new Date(),
): ChartPoint[] {
  if (range === 'month') {
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const minutes = sumSessionsInWindow(sessions, start.getTime(), end.getTime());
      return {
        label: start.toLocaleDateString(chartLocale, { month: 'short' }),
        fullLabel: start.toLocaleDateString(chartLocale, { month: 'long', year: 'numeric' }),
        minutes,
        current: index === 5,
      };
    });
  }

  if (range === 'week') {
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    return Array.from({ length: 6 }, (_, index) => {
      const end = new Date(endToday);
      end.setDate(end.getDate() - (5 - index) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const minutes = sumSessionsInWindow(sessions, start.getTime(), end.getTime());
      return {
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        fullLabel: `Week of ${start.toLocaleDateString(chartLocale, {
          month: 'short',
          day: 'numeric',
        })}`,
        minutes,
        current: index === 5,
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const minutes = sumSessionsInWindow(sessions, date.getTime(), next.getTime());
    return {
      label: date.toLocaleDateString(chartLocale, { weekday: 'narrow' }),
      fullLabel: date.toLocaleDateString(chartLocale, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      minutes,
      current: index === 6,
    };
  });
}

function sumSessionsInWindow(sessions: FocusSession[], start: number, end: number): number {
  return sessions
    .filter((session) => session.endedAt >= start && session.endedAt < end)
    .reduce((total, session) => total + sessionMinutes(session), 0);
}

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
