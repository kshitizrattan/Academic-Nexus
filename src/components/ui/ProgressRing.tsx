import React from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'mastery' | 'active' | 'remediation' | 'slate';
  label?: string;
}

const TONE_STROKES: Record<NonNullable<ProgressRingProps['tone']>, string> = {
  mastery: '#059669',
  active: '#0051d5',
  remediation: '#d97706',
  slate: '#1e293b',
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 48,
  strokeWidth = 4,
  tone = 'active',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKES[tone]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-semibold font-mono tabular-nums text-[#0b1c30]">
        {clamped}%
      </span>
    </div>
  );
};
