import {
  BREAK_SECONDS,
  DEFAULT_FOCUS_MODES,
  FOCUS_COLORS,
  FOCUS_SECONDS,
  MAX_FOCUS_MODES,
  SESSION_MINUTES,
} from './faraway';
import type { FarawaySnapshot, FocusColor, FocusMode, FocusSession, TimerMode } from './models';

const TIMER_MODES: TimerMode[] = ['idle', 'focus', 'paused', 'break-ready', 'break', 'complete'];

export function createInitialSnapshot(): FarawaySnapshot {
  return {
    version: 1,
    timer: {
      mode: 'idle',
      remaining: FOCUS_SECONDS,
      endsAt: null,
    },
    remindersEnabled: true,
    focusModes: DEFAULT_FOCUS_MODES.map((mode) => ({ ...mode })),
    activeModeId: DEFAULT_FOCUS_MODES[0].id,
    sessions: [],
  };
}

export function normalizeSnapshot(input: unknown): FarawaySnapshot {
  if (!isRecord(input)) return createInitialSnapshot();

  const focusModes = normalizeFocusModes(input.focusModes);
  const activeModeId = focusModes.some((mode) => mode.id === input.activeModeId)
    ? (input.activeModeId as string)
    : focusModes[0].id;
  const sessions = normalizeSessions(input.sessions);
  const rawTimer = isRecord(input.timer) ? input.timer : {};
  const mode = TIMER_MODES.includes(rawTimer.mode as TimerMode)
    ? (rawTimer.mode as TimerMode)
    : 'idle';
  const rawEndsAt = typeof rawTimer.endsAt === 'number' ? rawTimer.endsAt : null;
  const endsAt =
    rawEndsAt !== null && Number.isFinite(rawEndsAt) && rawEndsAt > 0 ? rawEndsAt : null;
  const remaining = normalizeRemaining(mode, rawTimer.remaining);

  return {
    version: 1,
    timer: { mode, remaining, endsAt },
    remindersEnabled: typeof input.remindersEnabled === 'boolean' ? input.remindersEnabled : true,
    focusModes,
    activeModeId,
    sessions,
  };
}

export function reconcileSnapshot(snapshot: FarawaySnapshot, now: number): FarawaySnapshot {
  const timer = snapshot.timer;

  if (timer.endsAt !== null && timer.mode === 'focus' && now >= timer.endsAt) {
    return finishFocus(snapshot, timer.endsAt);
  }

  if (timer.endsAt !== null && timer.mode === 'break' && now >= timer.endsAt) {
    return {
      ...snapshot,
      timer: { mode: 'complete', remaining: 0, endsAt: null },
    };
  }

  if (timer.mode === 'focus') {
    if (timer.endsAt === null) {
      return {
        ...snapshot,
        timer: {
          mode: 'paused',
          remaining: clamp(timer.remaining, 1, FOCUS_SECONDS),
          endsAt: null,
        },
      };
    }

    return {
      ...snapshot,
      timer: {
        ...timer,
        remaining: Math.max(1, Math.ceil((timer.endsAt - now) / 1000)),
      },
    };
  }

  if (timer.mode === 'break' && timer.endsAt === null) {
    return {
      ...snapshot,
      timer: { mode: 'break-ready', remaining: BREAK_SECONDS, endsAt: null },
    };
  }

  if (timer.mode === 'idle') {
    return {
      ...snapshot,
      timer: { mode: 'idle', remaining: FOCUS_SECONDS, endsAt: null },
    };
  }

  if (timer.mode === 'break-ready' || timer.mode === 'complete') {
    return {
      ...snapshot,
      timer: {
        mode: timer.mode,
        remaining: timer.mode === 'complete' ? 0 : BREAK_SECONDS,
        endsAt: null,
      },
    };
  }

  return snapshot;
}

export function finishFocus(snapshot: FarawaySnapshot, endedAt: number): FarawaySnapshot {
  const activeMode =
    snapshot.focusModes.find((mode) => mode.id === snapshot.activeModeId) ?? snapshot.focusModes[0];

  const session: FocusSession = {
    id: `focus-${endedAt}`,
    endedAt,
    modeId: activeMode.id,
    modeLabel: activeMode.label,
    modeColor: activeMode.color,
    focusMinutes: SESSION_MINUTES,
  };

  const alreadyRecorded = snapshot.sessions.some((item) => item.id === session.id);

  return {
    ...snapshot,
    timer: { mode: 'break-ready', remaining: BREAK_SECONDS, endsAt: null },
    sessions: alreadyRecorded ? snapshot.sessions : [...snapshot.sessions, session],
  };
}

export function stopFocus(snapshot: FarawaySnapshot, stoppedAt: number): FarawaySnapshot {
  const timer = snapshot.timer;
  if (timer.mode !== 'focus' && timer.mode !== 'paused') return snapshot;

  const activeMode =
    snapshot.focusModes.find((mode) => mode.id === snapshot.activeModeId) ?? snapshot.focusModes[0];
  const remaining =
    timer.mode === 'focus' && timer.endsAt !== null
      ? Math.max(0, Math.ceil((timer.endsAt - stoppedAt) / 1000))
      : Math.max(0, timer.remaining);
  const elapsedSeconds = Math.max(0, FOCUS_SECONDS - remaining);

  let sessions = snapshot.sessions;
  if (elapsedSeconds >= 60 && activeMode) {
    const session: FocusSession = {
      id: `focus-stop-${stoppedAt}`,
      endedAt: stoppedAt,
      modeId: activeMode.id,
      modeLabel: activeMode.label,
      modeColor: activeMode.color,
      focusMinutes: Math.max(1, Math.floor(elapsedSeconds / 60)),
    };
    const alreadyRecorded = sessions.some((item) => item.id === session.id);
    if (!alreadyRecorded) sessions = [...sessions, session];
  }

  return {
    ...snapshot,
    timer: { mode: 'idle', remaining: FOCUS_SECONDS, endsAt: null },
    sessions,
  };
}

function normalizeFocusModes(value: unknown): FocusMode[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_FOCUS_MODES.map((mode) => ({ ...mode }));
  }

  const modes: FocusMode[] = [];
  const usedIds = new Set<string>();
  const usedColors = new Set<FocusColor>();

  value.slice(0, MAX_FOCUS_MODES).forEach((candidate, index) => {
    if (!isRecord(candidate)) return;

    const label =
      typeof candidate.label === 'string' && candidate.label.trim()
        ? candidate.label.trim().slice(0, 18)
        : defaultLabel(index);
    let id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `mode-${index + 1}`;
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);

    const requestedColor = FOCUS_COLORS.includes(candidate.color as FocusColor)
      ? (candidate.color as FocusColor)
      : null;
    const color =
      requestedColor && !usedColors.has(requestedColor)
        ? requestedColor
        : (FOCUS_COLORS.find((item) => !usedColors.has(item)) ?? 'work');
    usedColors.add(color);

    modes.push({ id, label, color });
  });

  return modes.length > 0 ? modes : DEFAULT_FOCUS_MODES.map((mode) => ({ ...mode }));
}

function normalizeSessions(value: unknown): FocusSession[] {
  if (!Array.isArray(value)) return [];

  const sessions = new Map<string, FocusSession>();

  value.forEach((candidate, index) => {
    if (!isRecord(candidate)) return;
    const endedAt = candidate.endedAt;
    if (typeof endedAt !== 'number' || !Number.isFinite(endedAt) || endedAt <= 0) return;

    const modeId =
      typeof candidate.modeId === 'string' && candidate.modeId.trim()
        ? candidate.modeId.trim()
        : 'work';
    const modeLabel =
      typeof candidate.modeLabel === 'string' && candidate.modeLabel.trim()
        ? candidate.modeLabel.trim().slice(0, 18)
        : 'Work';
    const modeColor = FOCUS_COLORS.includes(candidate.modeColor as FocusColor)
      ? (candidate.modeColor as FocusColor)
      : 'work';
    const focusMinutes =
      typeof candidate.focusMinutes === 'number' && Number.isFinite(candidate.focusMinutes)
        ? Math.max(1, Math.min(candidate.focusMinutes, 24 * 60))
        : SESSION_MINUTES;
    let id =
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id.trim()
        : `session-${endedAt}-${index}`;
    while (sessions.has(id)) id = `${id}-${index}`;

    sessions.set(id, {
      id,
      endedAt,
      modeId,
      modeLabel,
      modeColor,
      focusMinutes,
    });
  });

  return Array.from(sessions.values()).sort((a, b) => a.endedAt - b.endedAt);
}

function normalizeRemaining(mode: TimerMode, value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : NaN;

  if (mode === 'idle') return FOCUS_SECONDS;
  if (mode === 'break-ready') return BREAK_SECONDS;
  if (mode === 'complete') return 0;
  if (Number.isNaN(numeric)) {
    return mode === 'break' ? BREAK_SECONDS : FOCUS_SECONDS;
  }
  if (mode === 'break') return clamp(numeric, 1, BREAK_SECONDS);
  return clamp(numeric, 1, FOCUS_SECONDS);
}

function defaultLabel(index: number): string {
  return DEFAULT_FOCUS_MODES[index % DEFAULT_FOCUS_MODES.length].label;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
