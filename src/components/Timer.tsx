import React from 'react';

interface TimerProps {
  seconds: number;
  maxSeconds: number;
  isRunning: boolean;
  size?: number;
}

export function Timer({ seconds, maxSeconds, isRunning, size = 120 }: TimerProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / maxSeconds;
  const offset = circumference * (1 - progress);

  const isWarning = seconds <= 10;
  const isCritical = seconds <= 5;

  const getColor = () => {
    if (isCritical) return '#ef4444';
    if (isWarning) return '#f59e0b';
    return '#8b5cf6';
  };

  return (
    <div className={`timer-circle ${isWarning && isRunning ? 'timer-warning' : ''}`}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none',
          }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ color: getColor() }}
      >
        <span className={`font-bold ${size > 100 ? 'text-4xl' : 'text-2xl'}`}>
          {seconds}
        </span>
        <span className="text-xs text-white/60">секунд</span>
      </div>
    </div>
  );
}
