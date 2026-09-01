type EnglishIconProps = {
  size?: number;
  className?: string;
};

export function EnglishIcon({ size = 28, className }: EnglishIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="English"
    >
      <circle cx="50" cy="50" r="48" fill="#fff" stroke="var(--line)" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="52"
        fontWeight="700"
        fontFamily="var(--font-ui-active, sans-serif)"
        fill="var(--blue)"
      >
        A
      </text>
    </svg>
  );
}
