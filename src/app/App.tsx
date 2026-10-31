import { useCallback, useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { FocusScreen } from '../components/FocusScreen';
import { InsightsScreen } from '../components/InsightsScreen';
import { Landing } from '../components/Landing';
import { SettingsScreen } from '../components/SettingsScreen';
import { useFaraway } from '../features/useFaraway';

type View = 'landing' | 'focus' | 'insights' | 'settings';

export default function App() {
  const controller = useFaraway();
  const [view, setView] = useState<View>('landing');
  const continueToFocus = useCallback(() => setView('focus'), []);
  const openSettings = useCallback(() => setView('settings'), []);
  const changeView = useCallback((nextView: 'focus' | 'insights') => {
    setView(nextView);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener('backButton', () => {
      setView((current) => {
        if (current === 'settings' || current === 'insights') return 'focus';
        if (current === 'landing') return 'focus';
        void CapacitorApp.exitApp();
        return current;
      });
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        listener = handle;
      }
    });

    return () => {
      disposed = true;
      if (listener) void listener.remove();
    };
  }, []);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <section className="phone" aria-label="Faraway">
        {!controller.ready ? (
          <div className="boot-screen" aria-label="Opening Faraway">
            <span className="wordmark">Faraway</span>
          </div>
        ) : view === 'landing' ? (
          <Landing tip={controller.randomEyeTip} onContinue={continueToFocus} />
        ) : view === 'settings' ? (
          <SettingsScreen controller={controller} onBack={() => setView('focus')} />
        ) : view === 'insights' ? (
          <InsightsScreen controller={controller} onChangeView={changeView} />
        ) : (
          <FocusScreen
            controller={controller}
            onOpenSettings={openSettings}
            onChangeView={changeView}
          />
        )}
      </section>
    </main>
  );
}
