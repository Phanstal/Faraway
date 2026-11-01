import { describe, expect, it } from 'vitest';
import {
  BREAK_SECONDS,
  FOCUS_SECONDS,
  buildChartData,
  formatClock,
  formatDuration,
  modeTotals,
  todayFocusMinutes,
} from '../../src/domain/faraway';
import type { FocusMode, FocusSession } from '../../src/domain/models';

const modes: FocusMode[] = [
  { id: 'work', label: 'Work', color: 'work' },
  { id: 'study', label: 'Study', color: 'study' },
  { id: 'creative', label: 'Creative', color: 'creative' },
];

function session(endedAt: number, overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: `focus-${endedAt}`,
    endedAt,
    modeId: 'work',
    modeLabel: 'Work',
    modeColor: 'work',
    focusMinutes: 20,
    ...overrides,
  };
}

describe('production timer', () => {
  it('starts at 20 minutes and breaks for 20 seconds', () => {
    expect(FOCUS_SECONDS).toBe(20 * 60);
    expect(BREAK_SECONDS).toBe(20);
    expect(formatClock(FOCUS_SECONDS)).toBe('20:00');
    expect(formatClock(BREAK_SECONDS)).toBe('00:20');
  });
});

describe('clock and duration formatting', () => {
  it('formats focus and break clocks with tabular minutes', () => {
    expect(formatClock(FOCUS_SECONDS)).toBe('20:00');
    expect(formatClock(BREAK_SECONDS)).toBe('00:20');
    expect(formatClock(61)).toBe('01:01');
    expect(formatClock(-4)).toBe('00:00');
  });

  it('formats accumulated focus time', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(20)).toBe('20m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(80)).toBe('1h 20m');
  });
});

describe('focus totals', () => {
  const now = new Date(2026, 9, 31, 12, 0, 0);
  const sessions = [
    session(new Date(2026, 9, 31, 9, 0, 0).getTime()),
    session(new Date(2026, 9, 31, 14, 0, 0).getTime(), {
      id: 'second',
      modeId: 'study',
      modeLabel: 'Study',
      modeColor: 'study',
    }),
    session(new Date(2026, 9, 30, 14, 0, 0).getTime(), { id: 'yesterday' }),
  ];

  it('counts today in the local timezone', () => {
    expect(todayFocusMinutes(sessions, now)).toBe(40);
  });

  it('groups mode totals and includes unused modes', () => {
    expect(modeTotals(sessions, modes)).toEqual([
      { id: 'work', label: 'Work', color: 'work', minutes: 40 },
      { id: 'study', label: 'Study', color: 'study', minutes: 20 },
      { id: 'creative', label: 'Creative', color: 'creative', minutes: 0 },
    ]);
  });

  it('keeps removed mode labels in history', () => {
    const result = modeTotals(
      [session(now.getTime(), { modeId: 'old', modeLabel: 'Reading', modeColor: 'study' })],
      modes,
    );
    expect(result.find((item) => item.id === 'old')).toMatchObject({
      label: 'Reading',
      minutes: 20,
    });
  });
});

describe('chart data', () => {
  const now = new Date(2026, 9, 31, 12, 0, 0);
  const sessions = [
    session(new Date(2026, 9, 31, 9, 0, 0).getTime()),
    session(new Date(2026, 9, 30, 9, 0, 0).getTime()),
    session(new Date(2026, 9, 25, 9, 0, 0).getTime()),
    session(new Date(2026, 8, 10, 9, 0, 0).getTime()),
  ];

  it('builds seven local day buckets ending today', () => {
    const data = buildChartData(sessions, 'day', now);
    expect(data).toHaveLength(7);
    expect(data[6]).toMatchObject({ minutes: 20, current: true, label: 'S' });
    expect(data[6].segments).toEqual([{ color: 'work', minutes: 20 }]);
    expect(data[5].segments).toEqual([{ color: 'work', minutes: 20 }]);
    expect(data[5].minutes).toBe(20);
  });

  it('splits each bucket into mode-colored segments', () => {
    const mixed = [
      session(new Date(2026, 9, 31, 9, 0, 0).getTime(), { focusMinutes: 20 }),
      session(new Date(2026, 9, 31, 10, 0, 0).getTime(), {
        id: 'study',
        modeId: 'study',
        modeLabel: 'Study',
        modeColor: 'study',
        focusMinutes: 15,
      }),
      session(new Date(2026, 9, 31, 11, 0, 0).getTime(), {
        id: 'creative',
        modeId: 'creative',
        modeLabel: 'Creative',
        modeColor: 'creative',
        focusMinutes: 10,
      }),
    ];

    expect(buildChartData(mixed, 'day', now)[6].segments).toEqual([
      { color: 'work', minutes: 20 },
      { color: 'study', minutes: 15 },
      { color: 'creative', minutes: 10 },
    ]);
  });

  it('builds six week buckets and six month buckets', () => {
    expect(buildChartData(sessions, 'week', now)).toHaveLength(6);
    expect(buildChartData(sessions, 'month', now)).toHaveLength(6);
    expect(buildChartData([], 'day', now).every((point) => point.minutes === 0)).toBe(true);
  });

  it('uses English labels regardless of host locale', () => {
    const data = buildChartData([], 'day', now);
    expect(data.map((point) => point.label)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });
});
