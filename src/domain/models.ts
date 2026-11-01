export type FocusColor = 'work' | 'study' | 'creative';

export type TimerMode = 'idle' | 'focus' | 'paused' | 'break-ready' | 'break' | 'complete';

export type ChartRange = 'day' | 'week' | 'month';

export type NotificationPermissionState = 'not-determined' | 'granted' | 'denied' | 'unsupported';

export interface FocusMode {
  id: string;
  label: string;
  color: FocusColor;
}

export interface FocusSession {
  id: string;
  endedAt: number;
  modeId: string;
  modeLabel: string;
  modeColor: FocusColor;
  focusMinutes: number;
}

export interface TimerState {
  mode: TimerMode;
  remaining: number;
  endsAt: number | null;
}

export interface FarawaySnapshot {
  version: 1;
  timer: TimerState;
  remindersEnabled: boolean;
  focusModes: FocusMode[];
  activeModeId: string;
  sessions: FocusSession[];
}

export interface ChartSegment {
  color: FocusColor;
  minutes: number;
}

export interface ChartPoint {
  label: string;
  minutes: number;
  current: boolean;
  fullLabel: string;
  segments: ChartSegment[];
}

export interface ModeTotal {
  id: string;
  label: string;
  color: FocusColor;
  minutes: number;
}
