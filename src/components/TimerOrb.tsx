import type { TimerMode } from '../domain/models';
import { formatClock } from '../domain/faraway';

interface TimerOrbProps {
  mode: TimerMode;
  remaining: number;
  total: number;
}

const RADIUS = 132;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BREAK_MODES: TimerMode[] = ['break-ready', 'break', 'complete'];

export function TimerOrb({ mode, remaining, total }: TimerOrbProps) {
  const progress = Math.max(0.03, Math.min(1, remaining / total));
  const isBreak = BREAK_MODES.includes(mode);
  const eyebrow = isBreak
    ? mode === 'complete'
      ? 'COMPLETE'
      : 'EYE BREAK'
    : mode === 'paused'
      ? 'PAUSED'
      : 'FOCUS TIME';
  const detail = isBreak
    ? 'Look far away'
    : mode === 'idle'
      ? 'Ready when you are'
      : 'Until your next break';

  return (
    <div className={`timer-orb ${isBreak ? 'break-orb' : ''}`}>
      <div className="orb-glow" />
      <svg className="timer-svg" viewBox="0 0 300 300" aria-hidden="true">
        <circle className="timer-track" cx="150" cy="150" r={RADIUS} />
        <circle
          className="timer-progress"
          cx="150"
          cy="150"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>

      <div className="timer-copy">
        <span className="eyebrow">{eyebrow}</span>
        <span className="timer-value">
          {mode === 'complete' ? '00:00' : formatClock(remaining)}
        </span>
        <span className="timer-detail">{detail}</span>
      </div>
    </div>
  );
}
