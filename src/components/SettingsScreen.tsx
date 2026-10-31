import { useState } from 'react';
import { MAX_FOCUS_MODES } from '../domain/faraway';
import type { FocusMode, NotificationPermissionState } from '../domain/models';
import type { FarawayController } from '../features/useFaraway';
import { Icon } from './Icon';

interface SettingsScreenProps {
  controller: FarawayController;
  onBack: () => void;
}

const NOTIFICATION_COPY: Record<
  NotificationPermissionState,
  { pill: string; detail: string; canAsk: boolean }
> = {
  granted: {
    pill: 'Enabled',
    detail: 'Eye-break alerts are on.',
    canAsk: false,
  },
  denied: {
    pill: 'Denied',
    detail: 'Allow notifications in system settings.',
    canAsk: false,
  },
  'not-determined': {
    pill: 'Not set',
    detail: 'Permission not requested',
    canAsk: true,
  },
  unsupported: {
    pill: 'Unavailable',
    detail: 'Notifications are not available here.',
    canAsk: false,
  },
};

export function SettingsScreen({ controller, onBack }: SettingsScreenProps) {
  const {
    focusModes,
    remindersEnabled,
    notificationPermission,
    renameMode,
    addMode,
    removeMode,
    setRemindersEnabled,
    requestNotifications,
  } = controller;
  const [addingMode, setAddingMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const notificationCopy = NOTIFICATION_COPY[notificationPermission];

  const submitMode = () => {
    const error = addMode(newModeName);
    if (error) {
      setAddError(error);
      return;
    }
    setNewModeName('');
    setAddError(null);
    setAddingMode(false);
  };

  return (
    <div className="screen settings-screen">
      <header className="settings-header">
        <button type="button" className="icon-button back" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1 className="page-title">Settings</h1>
        <span className="header-spacer" aria-hidden="true" />
      </header>

      <div className="settings-body">
        <div className="settings-group">
          <div className="setting-row">
            <span>
              <strong>Eye-break reminders</strong>
              <small>Every 20 minutes of focus</small>
            </span>
            <button
              type="button"
              className={`switch ${remindersEnabled ? 'on' : ''}`}
              role="switch"
              aria-checked={remindersEnabled}
              aria-label="Eye-break reminders"
              onClick={() => setRemindersEnabled(!remindersEnabled)}
            >
              <span />
            </button>
          </div>

          <div className="setting-row">
            <span>
              <strong>Notifications</strong>
              <small>{notificationCopy.detail}</small>
            </span>
            <button
              type="button"
              className="status-pill"
              disabled={!notificationCopy.canAsk}
              onClick={() => void requestNotifications()}
              aria-label={
                notificationCopy.canAsk
                  ? 'Request notification permission'
                  : `Notification status: ${notificationCopy.pill}`
              }
            >
              {notificationCopy.pill}
            </button>
          </div>
        </div>

        <div className="mode-settings">
          <div className="settings-section-heading">
            <span>
              <strong>Focus modes</strong>
              <small>Edit or remove the modes shown on the timer.</small>
            </span>
          </div>

          <div className="mode-list">
            {focusModes.map((modeItem) => (
              <ModeRow
                key={modeItem.id}
                mode={modeItem}
                canRemove={focusModes.length > 1}
                onRename={renameMode}
                onRemove={removeMode}
              />
            ))}
          </div>

          {focusModes.length < MAX_FOCUS_MODES && (
            <div className="add-modes">
              {!addingMode ? (
                <button
                  type="button"
                  className="add-mode-button"
                  onClick={() => {
                    setAddingMode(true);
                    setAddError(null);
                  }}
                  aria-label="Add focus mode"
                >
                  +
                </button>
              ) : (
                <div className="new-mode-field">
                  <input
                    autoFocus
                    value={newModeName}
                    onChange={(event) => {
                      setNewModeName(event.target.value);
                      if (addError) setAddError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') submitMode();
                      if (event.key === 'Escape') {
                        setAddingMode(false);
                        setNewModeName('');
                        setAddError(null);
                      }
                    }}
                    placeholder="Mode name"
                    maxLength={18}
                    aria-label="New focus mode name"
                  />
                  <button type="button" onClick={submitMode} disabled={!newModeName.trim()}>
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
          {addError && <p className="field-error">{addError}</p>}
        </div>

        <div className="info-card">
          <span className="info-number">20 · 20 · 20</span>
          <strong>A gentle reminder to look farther.</strong>
          <p>
            After 20 minutes of screen time, take in the view about 20 meters away for at least 20
            seconds.
          </p>
        </div>

        <div className="privacy">
          <strong>Private by design</strong>
          <p>
            Your focus history is stored locally on this device. Faraway has no accounts and does
            not upload your activity.
          </p>
        </div>
      </div>
    </div>
  );
}

interface ModeRowProps {
  mode: FocusMode;
  canRemove: boolean;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}

function ModeRow({ mode, canRemove, onRename, onRemove }: ModeRowProps) {
  const [draft, setDraft] = useState(mode.label);

  const commit = () => {
    const next = draft.trim() || 'Focus';
    setDraft(next);
    onRename(mode.id, next);
  };

  return (
    <div className="mode-edit-row">
      <span className={`mode-dot ${mode.color}`} aria-hidden="true" />
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        aria-label={`Edit ${mode.label} mode name`}
        maxLength={18}
      />
      <button
        type="button"
        className="remove-mode"
        onClick={() => onRemove(mode.id)}
        disabled={!canRemove}
        aria-label={`Remove ${mode.label} mode`}
      >
        Remove
      </button>
    </div>
  );
}
