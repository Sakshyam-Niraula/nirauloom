import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'horizontal' | 'icon' | 'badge';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withLink?: boolean;
}

export const WovenNIcon: React.FC<{ size?: number; className?: string; theme?: 'dark' | 'light' }> = ({
  size = 36,
  className = '',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const pillarColor = isDark ? '#E8DCC5' : '#173F35';
  const bgDisc = isDark ? '#112F28' : '#F5F0E6';
  const borderColor = isDark ? 'rgba(232, 220, 197, 0.2)' : 'rgba(23, 63, 53, 0.15)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:rotate-3 ${className}`}
      aria-label="NIRAULOOM Woven Symbol"
    >
      <defs>
        <linearGradient id={`n-weave-grad-${theme}`} x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor={isDark ? '#E8DCC5' : '#173F35'} />
        </linearGradient>
        <filter id="subtle-glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Rounded Container Plate */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={bgDisc} stroke={borderColor} strokeWidth="1.5" />

      {/* Left Pillar of N - Warp */}
      <rect x="16" y="14" width="7" height="36" rx="3.5" fill={pillarColor} />

      {/* Right Pillar of N - Warp */}
      <rect x="41" y="14" width="7" height="36" rx="3.5" fill={pillarColor} />

      {/* Primary Interwoven Weft Ribbon (Diagonal across the Loom) */}
      <path
        d="M19 16L45 48"
        stroke={`url(#n-weave-grad-${theme})`}
        strokeWidth="6.5"
        strokeLinecap="round"
      />

      {/* Interlocking Secondary Strand with Depth Overlap */}
      <path
        d="M26 23L38 39"
        stroke={pillarColor}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Central Loom Knot - Focal point representing discovery connection */}
      <circle cx="32" cy="32" r="3.5" fill="#8B5CF6" />
      <circle cx="32" cy="32" r="1.5" fill="#E8DCC5" />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
  withLink = true,
}) => {
  const pixelSizes = {
    sm: 28,
    md: 36,
    lg: 46,
    xl: 58,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-sand-100' : 'text-forest-900';
  const subtextColor = isDark ? 'text-sand-300/70' : 'text-forest-700/80';

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <WovenNIcon size={pixelSizes[size]} theme={theme} />
      {variant !== 'icon' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-wider font-sans uppercase ${textSizes[size]} ${textColor} leading-none`}
            >
              NIRAULOOM
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
          </div>
          {variant === 'horizontal' && size !== 'sm' && (
            <span
              className={`text-[9px] tracking-[0.2em] uppercase font-semibold font-sans mt-0.5 ${subtextColor}`}
            >
              Digital Discovery Platform
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link to="/" className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};
