import { BREAK_SECONDS, FOCUS_SECONDS, formatClock, formatDuration } from '../domain/faraway';
import type { FarawayController } from '../features/useFaraway';
import { Icon } from './Icon';
import { TabBar } from './TabBar';
import { TimerOrb } from './TimerOrb';

interface FocusScreenProps {
  controller: FarawayController;
  onOpenSettings: () => void;
  onChangeView: (view: 'focus' | 'insights') => void;
}

export function FocusScreen({ controller, onOpenSettings, onChangeView }: FocusScreenProps) {
  const {
    mode,
    remaining,
    focusModes,
    activeModeId,
    activeMode,
    todayMinutes,
    chooseMode,
    startBreak,
    skipBreak,
    handlePrimary,
  } = controller;
  const isBreak = mode === 'break-ready' || mode === 'break' || mode === 'complete';
  const total = isBreak ? BREAK_SECONDS : FOCUS_SECONDS;
  const guidanceTitle =
    mode === 'break-ready' || mode === 'break'
      ? 'Look Beyond.'
      : mode === 'complete'
        ? "Lovely. You're ready to continue."
        : mode === 'paused'
          ? 'Take your time.'
          : 'Stay with what matters.';
  const guidanceDetail =
    mode === 'break-ready' || mode === 'break'
      ? 'Take in the view about 20 meters away for 20 seconds.'
      : mode === 'complete'
        ? 'Begin the next interval when you are ready.'
        : mode === 'paused'
          ? 'Your focus time is paused.'
          : `Eye break in ${formatClock(remaining)}`;
  const primaryLabel =
    mode === 'idle'
      ? 'Start Focus'
      : mode === 'focus'
        ? 'Pause'
        : mode === 'paused'
          ? 'Resume'
          : 'Resume Focus';

  return (
    <div
      className={`screen focus-screen focus-${activeMode.color} ${isBreak ? 'break-screen' : ''}`}
    >
      <header className="topbar">
        <div>
          <span className="wordmark">Faraway</span>
          <span className="tagline">Look beyond the screen.</span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          <Icon name="settings" />
        </button>
      </header>

      <div className="focus-content">
        <TimerOrb mode={mode} remaining={remaining} total={total} onStartBreak={startBreak} />

        {mode === 'idle' && (
          <div className="focus-type-picker" aria-label="Choose focus type">
            {focusModes.map((modeItem) => (
              <button
                type="button"
                key={modeItem.id}
                className={activeModeId === modeItem.id ? `selected ${modeItem.color}` : ''}
                aria-pressed={activeModeId === modeItem.id}
                onClick={() => chooseMode(modeItem.id)}
              >
                {modeItem.label || 'Focus'}
              </button>
            ))}
          </div>
        )}

        <div className="guidance" aria-live="polite">
          <span className="guidance-title">{guidanceTitle}</span>
          <span className="guidance-detail">{guidanceDetail}</span>
        </div>

        <div className="actions">
          {mode !== 'break-ready' && (
            <button type="button" className="primary-button" onClick={handlePrimary}>
              {primaryLabel}
            </button>
          )}
          {mode === 'break' && (
            <button type="button" className="text-button" onClick={skipBreak}>
              Skip break
            </button>
          )}
          {!isBreak && (
            <span className="today-note">
              {todayMinutes
                ? `${formatDuration(todayMinutes)} focused today`
                : 'Your focus time will appear here'}
            </span>
          )}
        </div>
      </div>

      <TabBar view="focus" onChange={onChangeView} />
    </div>
  );
}
