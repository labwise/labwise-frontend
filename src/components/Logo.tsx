interface LogoProps {
  className?: string;
}

export function Logo({ className = 'h-9 w-auto' }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="랩와이즈"
      className={className}
      style={{ display: 'block' }}
    />
  );
}
