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
      {/*
        Rhinoceros Hornbill side profile facing right.
        Key features: round head, massive curved bill, upturned casque,
        stocky body, white tail with black band, red eye.
      */}

      {/* Casque — upturned horn sitting on top of bill base */}
      <path
        d="M28 18 Q32 8 42 6 Q48 5 50 9 Q52 13 48 16 L36 19 Z"
        fill="currentColor"
      />

      {/* Head — round */}
      <circle cx="22" cy="24" r="11" fill="currentColor" />

      {/* Upper bill — large, long, curving slightly down */}
      <path
        d="M30 20 L50 16 Q56 15 58 18 Q60 21 56 23 L30 26 Z"
        fill="currentColor"
      />

      {/* Lower bill — shorter, narrower mandible */}
      <path
        d="M30 27 L48 26 Q52 26 52 28 Q52 30 48 30 L30 30 Z"
        fill="currentColor"
      />

      {/* Bill seam line */}
      <line x1="30" y1="26" x2="55" y2="22" stroke="white" strokeWidth="1" opacity="0.7" />

      {/* Eye — red iris (male), black pupil */}
      <circle cx="25" cy="22" r="3" fill="white" />
      <circle cx="25" cy="22" r="2" fill="#dc2626" />
      <circle cx="25.3" cy="21.7" r="0.9" fill="black" />

      {/* Body — stocky, below head */}
      <path
        d="M14 34 Q8 38 7 46 Q6 52 10 56 L26 56 Q30 52 30 46 Q30 38 26 34 Z"
        fill="currentColor"
      />

      {/* Wing line */}
      <path
        d="M11 42 Q18 39 27 42"
        stroke="white" strokeWidth="0.8" opacity="0.25" strokeLinecap="round"
      />

      {/* Tail feathers — white with black band */}
      <rect x="10" y="55" width="5" height="8" rx="1.5" fill="white" stroke="currentColor" strokeWidth="0.7" />
      <rect x="16" y="55" width="5" height="8" rx="1.5" fill="white" stroke="currentColor" strokeWidth="0.7" />
      <rect x="22" y="55" width="5" height="8" rx="1.5" fill="white" stroke="currentColor" strokeWidth="0.7" />
      {/* Black band across tail feathers */}
      <rect x="10" y="59" width="5" height="2" rx="0.3" fill="currentColor" />
      <rect x="16" y="59" width="5" height="2" rx="0.3" fill="currentColor" />
      <rect x="22" y="59" width="5" height="2" rx="0.3" fill="currentColor" />
    </svg>
  );
}
