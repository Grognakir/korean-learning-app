type SettingsIconProps = {
  size?: number;
  className?: string;
};

export function SettingsIcon({ size = 14, className }: SettingsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5.5 14.25 8.103 17.629 8.75 16.5 12l1.129 3.25-3.379.647L12 18.5l-2.25-2.603-3.379-.647L7.5 12l-1.129-3.25 3.379-.647L12 5.5z" />
      <circle cx="12" cy="12" r="2.25" />
    </svg>
  );
}
