import { useMemo, useState } from 'react';
import { buildChartData, formatDuration, modeTotals } from '../domain/faraway';
import type { ChartRange } from '../domain/models';
import type { FarawayController } from '../features/useFaraway';
import { TabBar } from './TabBar';

interface InsightsScreenProps {
  controller: FarawayController;
  onChangeView: (view: 'focus' | 'insights') => void;
}

const RANGE_LABELS: Record<ChartRange, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

export function InsightsScreen({ controller, onChangeView }: InsightsScreenProps) {
  const [range, setRange] = useState<ChartRange>('day');
  const { sessions, focusModes, totalMinutes, todayMinutes } = controller;

  const chartData = useMemo(() => buildChartData(sessions, range), [sessions, range]);
  const max = Math.max(...chartData.map((point) => point.minutes), 60);
  const totals = useMemo(() => modeTotals(sessions, focusModes), [sessions, focusModes]);

  return (
    <div className="screen insights-screen">
      <header className="page-header">
        <h1 className="page-title">Insights</h1>
        <span className="page-subtitle">Your time, at a glance.</span>
      </header>

      <div className="stats">
        <article className="total-stat">
          <span className="stat-label">Total Focus Time</span>
          <span className="stat-value">{formatDuration(totalMinutes)}</span>
        </article>

        <article className="today-stat">
          <div>
            <span className="stat-label">Today’s Focus</span>
            <span className="stat-value small">{formatDuration(todayMinutes)}</span>
          </div>
          <span className="mini-orb" aria-hidden="true" />
        </article>

        <article className="mode-breakdown">
          <span className="section-title">Focus modes</span>
          <div className="mode-insight-list">
            {totals.map((mode) => (
              <div className="mode-insight-card" key={mode.id}>
                <span className="mode-insight-heading">
                  <span className={`mode-dot ${mode.color}`} aria-hidden="true" />
                  <span className="mode-insight-name">{mode.label || 'Focus'}</span>
                </span>
                <span className="mode-insight-time">{formatDuration(mode.minutes)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="trend">
          <div className="trend-header">
            <span className="section-title">Focus trend</span>
            <div className="range-picker" aria-label="Chart range">
              {(Object.keys(RANGE_LABELS) as ChartRange[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={range === item ? 'active' : ''}
                  aria-pressed={range === item}
                  onClick={() => setRange(item)}
                >
                  {RANGE_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          {sessions.length ? (
            <div className="chart" role="img" aria-label={`Focus trend by ${range}`}>
              {chartData.map((point, index) => (
                <div className="bar-column" key={`${point.fullLabel}-${index}`}>
                  <div
                    className={`bar ${point.current ? 'current' : ''}`}
                    style={{ height: `${Math.max(8, (point.minutes / max) * 100)}%` }}
                    title={`${point.fullLabel}: ${formatDuration(point.minutes)}`}
                  />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-visual" aria-hidden="true">
                <span />
              </span>
              <span className="empty-title">Your focus journey starts here.</span>
              <span className="empty-copy">
                Complete your first focus session to see your trend.
              </span>
            </div>
          )}
        </article>
      </div>

      <TabBar view="insights" onChange={onChangeView} />
    </div>
  );
}
