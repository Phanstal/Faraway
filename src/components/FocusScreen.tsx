import { useState } from 'react';
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
    skipBreak,
    stopFocus,
    handlePrimary,
  } = controller;
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
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
          : mode === 'break-ready'
            ? 'Start Break'
            : 'Resume Focus';

  const handlePrimaryAction = () => {
    setModeMenuOpen(false);
    setShowStopConfirm(false);
    handlePrimary();
  };

  return (
    <div
      className={`screen focus-screen focus-${activeMode.color} state-${mode} ${isBreak ? 'break-screen' : ''}`}
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
        <div
          className={`mode-selector ${modeMenuOpen ? 'open' : ''} ${isBreak ? 'mode-selector-hidden' : ''}`}
        >
          {!isBreak && (
            <>
              <button
                type="button"
                className={`current-mode-banner ${activeMode.color}`}
                onClick={() => setModeMenuOpen((open) => !open)}
                aria-expanded={modeMenuOpen}
                aria-label="Change focus mode"
              >
                <span className={`mode-dot ${activeMode.color}`} aria-hidden="true" />
                <span>{activeMode.label || 'Focus'}</span>
                <span className="mode-chevron" aria-hidden="true" />
              </button>
              {modeMenuOpen && (
                <div className="mode-menu">
                  {focusModes
                    .filter((modeItem) => modeItem.id !== activeModeId)
                    .map((modeItem) => (
                      <button
                        type="button"
                        key={modeItem.id}
                        onClick={() => {
                          chooseMode(modeItem.id);
                          setModeMenuOpen(false);
                        }}
                      >
                        <span className={`mode-dot ${modeItem.color}`} aria-hidden="true" />
                        <span>{modeItem.label || 'Focus'}</span>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <TimerOrb mode={mode} remaining={remaining} total={total} />

        <div className="guidance" aria-live="polite">
          <span className="guidance-title">{guidanceTitle}</span>
          <span className="guidance-detail">{guidanceDetail}</span>
        </div>

        <div className="actions">
          <button type="button" className="primary-button" onClick={handlePrimaryAction}>
            {primaryLabel}
          </button>
          {mode === 'break' && (
            <button type="button" className="text-button" onClick={skipBreak}>
              Skip break
            </button>
          )}
          {mode === 'focus' || mode === 'paused' ? (
            <button
              type="button"
              className="text-button stop-focus"
              onClick={() => setShowStopConfirm(true)}
            >
              Stop Focus
            </button>
          ) : (
            !isBreak && (
              <span className="today-note">
                {todayMinutes
                  ? `${formatDuration(todayMinutes)} focused today`
                  : 'Your focus time will appear here'}
              </span>
            )
          )}
        </div>
      </div>

      {showStopConfirm && (mode === 'focus' || mode === 'paused') && (
        <div
          className="confirm-overlay"
          role="presentation"
          onClick={() => setShowStopConfirm(false)}
        >
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stop-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="confirm-icon" aria-hidden="true">
              <span />
            </span>
            <span className="confirm-title" id="stop-title">
              Stop this focus?
            </span>
            <span className="confirm-copy">
              {FOCUS_SECONDS - remaining >= 60
                ? 'Your focused time so far will be saved to your history.'
                : 'Sessions under one minute aren’t added to your focus history.'}
            </span>
            <div className="confirm-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowStopConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-stop-button"
                onClick={() => {
                  setShowStopConfirm(false);
                  stopFocus();
                }}
              >
                Stop Focus
              </button>
            </div>
          </div>
        </div>
      )}

      <TabBar view="focus" onChange={onChangeView} />
    </div>
  );
}
