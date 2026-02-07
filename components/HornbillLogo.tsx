interface HornbillLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
}

const SIZES = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 64,
  hero: 80,
};

export default function HornbillLogo({ size = 'md', className = '' }: HornbillLogoProps) {
  const px = SIZES[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      aria-label="Rhinoceros Hornbill"
      role="img"
    >
      {/* Casque (horn on top of beak) */}
      <path d="M18 8c0-2 2-4 5-4 4 0 7 3 8 6l1 4c0 2-1 3-3 3h-5c-3 0-5-2-6-5v-4z" />
      {/* Large curved beak */}
      <path d="M24 14c2-1 5-1 7 0 3 2 6 5 8 9 2 5 2 9 0 12-1 2-3 3-6 3h-8l-6-2c-3-2-4-5-3-8l2-8c1-3 3-5 6-6z" />
      {/* Head */}
      <ellipse cx="16" cy="22" rx="10" ry="11" />
      {/* Eye */}
      <circle cx="13" cy="20" r="2.5" fill="white" />
      <circle cx="13.5" cy="19.5" r="1" fill="black" />
      {/* Body */}
      <path d="M12 32c-2 3-3 7-2 12 1 6 4 10 8 12h6c4-1 7-4 9-8 2-5 1-10-1-14-1-3-4-5-7-5-5-1-10 0-13 3z" />
      {/* Tail feathers */}
      <path d="M28 46c2 2 3 5 3 9l1 5h-4l-1-5c0-3-1-5-2-7l3-2z" />
      <path d="M22 48c1 2 1 5 0 8l-1 4h-4l2-5c1-3 1-5 0-7h3z" />
      {/* Wing detail */}
      <path d="M8 34c-1 2-2 5-1 8 0 2 1 4 3 5l2-1c-2-2-3-4-3-7 0-2 0-3 1-5H8z" opacity="0.6" />
    </svg>
  );
}
