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
      <path d="M4 5.5h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4.5 3.5V16.5H4a1 1 0 0 1-1-1v-8a2 2 0 0 1 1-2Z" />
      <path d="M9.5 10.2c0-1 .8-1.7 1.8-1.7s1.7.6 1.7 1.5c0 .8-.5 1.1-1 1.5-.4.3-.7.6-.7 1.1" />
      <circle cx="11.3" cy="14.3" r=".15" fill="currentColor" stroke="none" />
    </svg>
  );
}
