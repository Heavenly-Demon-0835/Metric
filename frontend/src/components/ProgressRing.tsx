"use client";

interface ProgressRingProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit?: string;
  onClick?: () => void;
}

export default function ProgressRing({
  current,
  target,
  size = 96,
  strokeWidth = 8,
  color,
  label,
  unit = "",
  onClick,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / (target || 1), 1);
  const offset = circumference * (1 - pct);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 ${onClick ? "active:scale-95 transition-transform cursor-pointer" : ""}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-extrabold leading-none">
            {Math.round(current)}
          </span>
          {unit && (
            <span className="text-[9px] font-bold text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
    </Wrapper>
  );
}
