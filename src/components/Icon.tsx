import type { SVGProps } from 'react';

export type IconName = 'focus' | 'insights' | 'settings' | 'back';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {name === 'focus' && (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === 'insights' && <path d="M4 19V10M10 19V5M16 19v-7M22 19V8" />}
      {name === 'settings' && (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V20.5h-3v-.28a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.56-1H5.5v-3h.02a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1-1.56V4.5h3v.28a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1h.54v3h-.54a1.7 1.7 0 0 0-1.56 1Z" />
        </>
      )}
      {name === 'back' && <path d="m15 18-6-6 6-6" />}
    </svg>
  );
}
