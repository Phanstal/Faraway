import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BREAK_SECONDS,
  DEFAULT_FOCUS_MODES,
  EYE_TIPS,
  FOCUS_COLORS,
  FOCUS_SECONDS,
  MAX_FOCUS_MODES,
  totalFocusMinutes,
  todayFocusMinutes,
} from '../domain/faraway';
import type {
  FarawaySnapshot,
  FocusMode,
  NotificationPermissionState,
  TimerMode,
} from '../domain/models';
import {
  createInitialSnapshot,
  finishFocus,
  normalizeSnapshot,
  reconcileSnapshot,
} from '../domain/snapshot';
import { farawayRepository } from '../infra/farawayRepository';
import { breakFeedback, completeFeedback, tapFeedback } from '../platform/feedback';
import {
  cancelEyeBreakNotification,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleEyeBreakNotification,
} from '../platform/notifications';

const DEFAULT_MODE_ID = DEFAULT_FOCUS_MODES[0].id;

export interface FarawayController {
  ready: boolean;
  mode: TimerMode;
  remaining: number;
  focusModes: FocusMode[];
  activeModeId: string;
  activeMode: FocusMode;
  sessions: FarawaySnapshot['sessions'];
  remindersEnabled: boolean;
  notificationPermission: NotificationPermissionState;
  todayMinutes: number;
  totalMinutes: number;
  randomEyeTip: string;
  chooseMode: (id: string) => void;
  renameMode: (id: string, label: string) => void;
  addMode: (label: string) => string | null;
  removeMode: (id: string) => void;
  startFocus: () => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  handlePrimary: () => void;
  setRemindersEnabled: (enabled: boolean) => void;
  requestNotifications: () => Promise<void>;
}

export function useFaraway(): FarawayController {
  const [snapshot, setSnapshot] = useState<FarawaySnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>('not-determined');
  const snapshotRef = useRef<FarawaySnapshot | null>(null);
  const previousModeRef = useRef<TimerMode>('idle');
  const [randomEyeTip] = useState(() => EYE_TIPS[Math.floor(Math.random() * EYE_TIPS.length)]);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const loaded = await farawayRepository.load();
      if (!alive) return;
      const reconciled = reconcileSnapshot(loaded, Date.now());
      setSnapshot(reconciled);
      previousModeRef.current = reconciled.timer.mode;
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !snapshot) return undefined;

    const timeout = window.setTimeout(() => {
      void farawayRepository.save(snapshot);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [ready, snapshot]);

  useEffect(() => {
    const flush = () => {
      if (snapshotRef.current) void farawayRepository.save(snapshotRef.current);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    void getNotificationPermission().then(setNotificationPermission);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (
      snapshot?.timer.mode === 'focus' &&
      snapshot.timer.endsAt &&
      snapshot.remindersEnabled &&
      notificationPermission === 'granted'
    ) {
      void scheduleEyeBreakNotification(snapshot.timer.endsAt);
    } else {
      void cancelEyeBreakNotification();
    }
  }, [
    ready,
    snapshot?.timer.mode,
    snapshot?.timer.endsAt,
    snapshot?.remindersEnabled,
    notificationPermission,
  ]);

  const mode = snapshot?.timer.mode ?? 'idle';
  const endsAt = snapshot?.timer.endsAt ?? null;

  useEffect(() => {
    if (!ready || !endsAt || (mode !== 'focus' && mode !== 'break')) return undefined;

    const tick = () => {
      const now = Date.now();

      if (now >= endsAt) {
        setSnapshot((current) => {
          if (!current) return current;
          if (current.timer.mode !== mode || current.timer.endsAt !== endsAt) {
            return current;
          }
          if (mode === 'focus') return finishFocus(current, endsAt);
          return {
            ...current,
            timer: { mode: 'complete', remaining: 0, endsAt: null },
          };
        });
        return;
      }

      const nextRemaining = Math.max(1, Math.ceil((endsAt - now) / 1000));
      setSnapshot((current) => {
        if (
          !current ||
          current.timer.mode !== mode ||
          current.timer.endsAt !== endsAt ||
          current.timer.remaining === nextRemaining
        ) {
          return current;
        }
        return {
          ...current,
          timer: { ...current.timer, remaining: nextRemaining },
        };
      });
    };

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [ready, mode, endsAt]);

  useEffect(() => {
    if (!snapshot) return;

    const currentMode = snapshot.timer.mode;
    const previousMode = previousModeRef.current;
    previousModeRef.current = currentMode;

    if (currentMode !== previousMode) {
      if (currentMode === 'break-ready') void breakFeedback();
      if (currentMode === 'complete') void completeFeedback();
    }
  }, [snapshot]);

  const refreshClock = useCallback(() => {
    setSnapshot((current) => (current ? reconcileSnapshot(current, Date.now()) : current));
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshClock();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [refreshClock]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let removed = false;
    let handle: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      refreshClock();
      void getNotificationPermission().then(setNotificationPermission);
    }).then((listener) => {
      if (removed) {
        void listener.remove();
      } else {
        handle = listener;
      }
    });

    return () => {
      removed = true;
      if (handle) void handle.remove();
    };
  }, [refreshClock]);

  const ensureNativePermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    const current = await getNotificationPermission();
    if (current === 'denied' || current === 'granted') {
      setNotificationPermission(current);
      return;
    }
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  }, []);

  const startFocus = useCallback(() => {
    const startedAt = Date.now();
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        timer: {
          mode: 'focus',
          remaining: FOCUS_SECONDS,
          endsAt: startedAt + FOCUS_SECONDS * 1000,
        },
      };
    });
    if (snapshotRef.current?.remindersEnabled) void ensureNativePermission();
    void tapFeedback();
  }, [ensureNativePermission]);

  const pauseFocus = useCallback(() => {
    setSnapshot((current) => {
      if (!current || current.timer.mode !== 'focus' || !current.timer.endsAt) return current;
      const remaining = Math.max(
        1,
        Math.min(FOCUS_SECONDS, Math.ceil((current.timer.endsAt - Date.now()) / 1000)),
      );
      return {
        ...current,
        timer: { mode: 'paused', remaining, endsAt: null },
      };
    });
    void tapFeedback();
  }, []);

  const resumeFocus = useCallback(() => {
    const now = Date.now();
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        timer: {
          mode: 'focus',
          remaining: Math.max(1, current.timer.remaining),
          endsAt: now + Math.max(1, current.timer.remaining) * 1000,
        },
      };
    });
    void tapFeedback();
  }, []);

  const startBreak = useCallback(() => {
    const now = Date.now();
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        timer: {
          mode: 'break',
          remaining: BREAK_SECONDS,
          endsAt: now + BREAK_SECONDS * 1000,
        },
      };
    });
    void tapFeedback();
  }, []);

  const skipBreak = useCallback(() => {
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        timer: { mode: 'complete', remaining: 0, endsAt: null },
      };
    });
  }, []);

  const handlePrimary = useCallback(() => {
    const currentMode = snapshotRef.current?.timer.mode ?? 'idle';
    if (currentMode === 'idle' || currentMode === 'complete' || currentMode === 'break') {
      startFocus();
      return;
    }
    if (currentMode === 'focus') {
      pauseFocus();
      return;
    }
    if (currentMode === 'paused') {
      resumeFocus();
      return;
    }
    if (currentMode === 'break-ready') startBreak();
  }, [pauseFocus, resumeFocus, startBreak, startFocus]);

  const chooseMode = useCallback((id: string) => {
    setSnapshot((current) => {
      if (!current || !current.focusModes.some((modeItem) => modeItem.id === id)) return current;
      return { ...current, activeModeId: id };
    });
  }, []);

  const renameMode = useCallback((id: string, label: string) => {
    const nextLabel = label.slice(0, 18);
    setSnapshot((current) => {
      if (!current) return current;
      return {
        ...current,
        focusModes: current.focusModes.map((modeItem) =>
          modeItem.id === id ? { ...modeItem, label: nextLabel } : modeItem,
        ),
      };
    });
  }, []);

  const addMode = useCallback((label: string): string | null => {
    const trimmed = label.trim().slice(0, 18);
    const current = snapshotRef.current;
    if (!current) return 'Faraway is still opening.';
    if (!trimmed) return 'Give the mode a name.';
    if (current.focusModes.length >= MAX_FOCUS_MODES) return 'You can keep three modes at a time.';
    if (
      current.focusModes.some((modeItem) => modeItem.label.toLowerCase() === trimmed.toLowerCase())
    ) {
      return 'That mode already exists.';
    }

    const usedColors = new Set(current.focusModes.map((modeItem) => modeItem.color));
    const color = FOCUS_COLORS.find((item) => !usedColors.has(item)) ?? 'work';
    const id = `mode-${Date.now()}`;

    setSnapshot((existing) => {
      if (!existing || existing.focusModes.length >= MAX_FOCUS_MODES) return existing;
      return {
        ...existing,
        focusModes: [...existing.focusModes, { id, label: trimmed, color }],
        activeModeId: id,
      };
    });

    return null;
  }, []);

  const removeMode = useCallback((id: string) => {
    setSnapshot((current) => {
      if (!current || current.focusModes.length <= 1) return current;
      const focusModes = current.focusModes.filter((modeItem) => modeItem.id !== id);
      if (focusModes.length === current.focusModes.length) return current;
      return {
        ...current,
        focusModes,
        activeModeId: current.activeModeId === id ? focusModes[0].id : current.activeModeId,
      };
    });
  }, []);

  const setRemindersEnabled = useCallback((enabled: boolean) => {
    setSnapshot((current) => (current ? { ...current, remindersEnabled: enabled } : current));
    if (enabled) {
      void requestNotificationPermission().then(setNotificationPermission);
    } else {
      void cancelEyeBreakNotification();
    }
  }, []);

  const requestNotifications = useCallback(async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
  }, []);

  const activeMode = useMemo(() => {
    if (!snapshot) return { ...DEFAULT_FOCUS_MODES[0], id: DEFAULT_MODE_ID };
    return (
      snapshot.focusModes.find((modeItem) => modeItem.id === snapshot.activeModeId) ??
      snapshot.focusModes[0] ?? { ...DEFAULT_FOCUS_MODES[0], id: DEFAULT_MODE_ID }
    );
  }, [snapshot]);

  const sessions = snapshot?.sessions ?? [];
  const todayMinutes = snapshot ? todayFocusMinutes(sessions) : 0;
  const totalMinutes = snapshot ? totalFocusMinutes(sessions) : 0;

  return {
    ready,
    mode,
    remaining: snapshot?.timer.remaining ?? FOCUS_SECONDS,
    focusModes: snapshot?.focusModes ?? DEFAULT_FOCUS_MODES,
    activeModeId: snapshot?.activeModeId ?? DEFAULT_MODE_ID,
    activeMode,
    sessions,
    remindersEnabled: snapshot?.remindersEnabled ?? true,
    notificationPermission,
    todayMinutes,
    totalMinutes,
    randomEyeTip,
    chooseMode,
    renameMode,
    addMode,
    removeMode,
    startFocus,
    pauseFocus,
    resumeFocus,
    startBreak,
    skipBreak,
    handlePrimary,
    setRemindersEnabled,
    requestNotifications,
  };
}

// Keep the normalizer reachable from the hook module in development tools and tests.
export { normalizeSnapshot, createInitialSnapshot };
