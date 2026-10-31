import { useEffect } from 'react';
import { LANDING_SECONDS } from '../domain/faraway';

interface LandingProps {
  tip: string;
  onContinue: () => void;
}

export function Landing({ tip, onContinue }: LandingProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onContinue, LANDING_SECONDS * 1000);
    return () => window.clearTimeout(timeout);
  }, [onContinue]);

  return (
    <div
      className="screen landing-screen"
      role="button"
      tabIndex={0}
      aria-label="Enter Faraway"
      onClick={onContinue}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onContinue();
        }
      }}
    >
      <div className="landing-brand">
        <span className="wordmark">Faraway</span>
        <span className="tagline">Look beyond the screen.</span>
      </div>

      <div className="landing-visual" aria-hidden="true">
        <span className="landing-sun" />
        <span className="horizon" />
      </div>

      <div className="landing-copy">
        <span className="eyebrow">A GENTLE REMINDER</span>
        <span className="landing-title">
          Focus here.
          <br />
          Look farther.
        </span>
        <span className="landing-tip">{tip}</span>
      </div>

      <span className="landing-progress" aria-hidden="true">
        <span style={{ animationDuration: `${LANDING_SECONDS}s` }} />
      </span>
    </div>
  );
}
