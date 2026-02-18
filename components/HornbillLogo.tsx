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
      fill="none"
      className={className}
      aria-label="Rhinoceros Hornbill"
      role="img"
    >
      {/* Rhinoceros Hornbill profile: prominent casque + oversized curved bill */}
      {/* Body */}
      <path
        d="M14 49 C11 43 13 35 19 31 C24 28 31 29 35 33 C38 36 40 41 39 46 C38 51 34 55 28 56 C22 57 17 54 14 49 Z"
        fill="currentColor"
      />

      {/* Tail block */}
      <path
        d="M12 46 C8 48 7 53 10 57 C13 61 18 61 21 57 C19 54 18 50 18 46 Z"
        fill="currentColor"
        opacity="0.85"
      />

      {/* Neck + head */}
      <path
        d="M28 34 C27 29 29 24 33 21 C37 18 43 18 47 21 C50 23 52 27 52 31 C52 35 50 39 46 41 C42 43 37 43 33 40 C31 39 29 37 28 34 Z"
        fill="currentColor"
      />

      {/* Upper bill */}
      <path
        d="M46 24 C52 20 59 20 62 23 C63 25 62 27 60 29 C57 31 53 32 49 32 C47 32 46 31 45 29 C44 27 44 25 46 24 Z"
        fill="currentColor"
      />

      {/* Lower bill */}
      <path
        d="M45 31 C50 30 56 31 59 33 C61 34 61 36 59 37 C55 39 49 39 45 37 C44 36 44 32 45 31 Z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Casque (horn on top of bill base) */}
      <path
        d="M40 20 C43 13 51 10 57 12 C60 13 61 15 61 17 C60 19 57 20 53 20 C49 20 45 20 42 21 Z"
        fill="currentColor"
      />

      {/* Eye */}
      <circle cx="42.5" cy="29.5" r="2.1" fill="white" />
      <circle cx="42.5" cy="29.5" r="1.2" fill="#111827" />

      {/* Bill seam detail */}
      <path
        d="M46 30 C50 29 55 29 58 30"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
