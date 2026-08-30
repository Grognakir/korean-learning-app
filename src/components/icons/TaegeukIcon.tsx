type TaegeukIconProps = {
  size?: number;
  className?: string;
};

export function TaegeukIcon({ size = 28, className }: TaegeukIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="태극기"
    >
      <circle cx="50" cy="50" r="48" fill="#fff" stroke="var(--line)" />
      <path
        d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2 Z"
        fill="var(--red)"
      />
      <path
        d="M50 2 A48 48 0 0 0 50 98 A24 24 0 0 0 50 50 A24 24 0 0 1 50 2 Z"
        fill="var(--blue)"
      />
    </svg>
  );
}
