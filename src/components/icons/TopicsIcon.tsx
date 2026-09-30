type IconProps = {
  size?: number;
  className?: string;
};

export function TopicsIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8.5 4.5h6a2 2 0 0 1 2 2v6" />
      <rect x="5" y="8.5" width="11" height="11" rx="2" />
    </svg>
  );
}
