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
      <path d="M9.5 4.5v15" />
      <path d="M14.5 4.5v15" />
      <path d="M4.5 9.5h15" />
      <path d="M4.5 14.5h15" />
    </svg>
  );
}
