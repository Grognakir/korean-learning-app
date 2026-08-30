type IconProps = {
  size?: number;
  className?: string;
};

export function BookIcon({ size = 20, className }: IconProps) {
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
      <path d="M4 5.5c2-1 4.5-1 6.5 0v13c-2-1-4.5-1-6.5 0v-13Z" />
      <path d="M17 5.5c-2-1-4.5-1-6.5 0v13c2-1 4.5-1 6.5 0v-13Z" />
    </svg>
  );
}
