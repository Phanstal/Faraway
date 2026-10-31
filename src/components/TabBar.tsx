import { Icon } from './Icon';

interface TabBarProps {
  view: 'focus' | 'insights';
  onChange: (view: 'focus' | 'insights') => void;
}

export function TabBar({ view, onChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Primary navigation">
      <button
        type="button"
        className={view === 'focus' ? 'active' : ''}
        aria-current={view === 'focus' ? 'page' : undefined}
        onClick={() => onChange('focus')}
      >
        <Icon name="focus" />
        <span>Focus</span>
      </button>
      <button
        type="button"
        className={view === 'insights' ? 'active' : ''}
        aria-current={view === 'insights' ? 'page' : undefined}
        onClick={() => onChange('insights')}
      >
        <Icon name="insights" />
        <span>Insights</span>
      </button>
    </nav>
  );
}
