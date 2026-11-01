import { describe, expect, it } from 'vitest';
import { BREAK_SECONDS, FOCUS_SECONDS } from '../../src/domain/faraway';
import type { FarawaySnapshot } from '../../src/domain/models';
import {
  createInitialSnapshot,
  finishFocus,
  normalizeSnapshot,
  reconcileSnapshot,
  stopFocus,
} from '../../src/domain/snapshot';

function snapshot(overrides: Partial<FarawaySnapshot> = {}): FarawaySnapshot {
  return {
    ...createInitialSnapshot(),
    ...overrides,
  };
}

describe('snapshot normalization', () => {
  it('falls back to sensible defaults for corrupt storage', () => {
    const result = normalizeSnapshot({ nonsense: true });
    expect(result.focusModes).toHaveLength(3);
    expect(result.activeModeId).toBe('work');
    expect(result.timer.mode).toBe('idle');
    expect(result.timer.remaining).toBe(FOCUS_SECONDS);
    expect(result.sessions).toEqual([]);
  });

  it('cleans mode names, colors and invalid sessions', () => {
    const result = normalizeSnapshot({
      timer: { mode: 'paused', remaining: 99, endsAt: null },
      remindersEnabled: false,
      focusModes: [
        { id: 'a', label: '  Deep Work  ', color: 'work' },
        { id: 'a', label: '', color: 'work' },
      ],
      activeModeId: 'missing',
      sessions: [
        { endedAt: 1000, modeId: 'a', modeLabel: 'Deep Work', modeColor: 'study' },
        { endedAt: 'not a number' },
      ],
    });

    expect(result.remindersEnabled).toBe(false);
    expect(result.focusModes).toHaveLength(2);
    expect(result.focusModes[0].label).toBe('Deep Work');
    expect(result.focusModes[1].label).toBe('Study');
    expect(new Set(result.focusModes.map((mode) => mode.id)).size).toBe(2);
    expect(result.activeModeId).toBe('a');
    expect(result.sessions).toHaveLength(1);
    expect(result.timer.mode).toBe('paused');
    expect(result.timer.remaining).toBe(99);
  });

  it('keeps only one session per focus completion', () => {
    const initial = snapshot();
    const endedAt = Date.now();
    const first = finishFocus(initial, endedAt);
    const second = finishFocus(first, endedAt);

    expect(first.sessions).toHaveLength(1);
    expect(second.sessions).toHaveLength(1);
    expect(first.timer.mode).toBe('break-ready');
    expect(first.timer.remaining).toBe(BREAK_SECONDS);
  });
});

describe('stopping a focus session', () => {
  it('saves elapsed minutes when more than a minute was focused', () => {
    const stoppedAt = Date.now();
    const result = stopFocus(
      snapshot({
        timer: { mode: 'focus', remaining: FOCUS_SECONDS - 70, endsAt: stoppedAt + 1130_000 },
        activeModeId: 'study',
      }),
      stoppedAt,
    );

    expect(result.timer).toEqual({
      mode: 'idle',
      remaining: FOCUS_SECONDS,
      endsAt: null,
    });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toMatchObject({
      modeId: 'study',
      modeLabel: 'Study',
      focusMinutes: 1,
      endedAt: stoppedAt,
    });
  });

  it('does not add sessions shorter than one minute', () => {
    const stoppedAt = Date.now();
    const result = stopFocus(
      snapshot({
        timer: { mode: 'paused', remaining: FOCUS_SECONDS - 30, endsAt: null },
      }),
      stoppedAt,
    );

    expect(result.timer.mode).toBe('idle');
    expect(result.sessions).toEqual([]);
  });
});

describe('timer reconciliation', () => {
  it('records a focus interval that ended while the app was closed', () => {
    const endedAt = Date.now() - 5000;
    const result = reconcileSnapshot(
      snapshot({
        timer: { mode: 'focus', remaining: 10, endsAt: endedAt },
        activeModeId: 'study',
      }),
      Date.now(),
    );

    expect(result.timer).toEqual({
      mode: 'break-ready',
      remaining: BREAK_SECONDS,
      endsAt: null,
    });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toMatchObject({
      modeId: 'study',
      modeLabel: 'Study',
      endedAt,
      focusMinutes: 20,
    });
  });

  it('completes a break that ran out in the background', () => {
    const result = reconcileSnapshot(
      snapshot({
        timer: { mode: 'break', remaining: 2, endsAt: Date.now() - 1000 },
      }),
      Date.now(),
    );

    expect(result.timer).toEqual({ mode: 'complete', remaining: 0, endsAt: null });
  });

  it('recomputes an active focus countdown', () => {
    const now = Date.now();
    const result = reconcileSnapshot(
      snapshot({
        timer: { mode: 'focus', remaining: 1200, endsAt: now + 90_000 },
      }),
      now,
    );

    expect(result.timer.mode).toBe('focus');
    expect(result.timer.remaining).toBe(90);
  });

  it('turns a focus timer without an end time into a pause', () => {
    const result = reconcileSnapshot(
      snapshot({ timer: { mode: 'focus', remaining: 400, endsAt: null } }),
      Date.now(),
    );

    expect(result.timer).toEqual({ mode: 'paused', remaining: 400, endsAt: null });
  });
});
