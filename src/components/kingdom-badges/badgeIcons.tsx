// Arte vetorial própria dos selos-bandeira do Kingdom — desenhada em SVG puro
// (sem dependência de ilustração externa), pensada pra caber no disco de
// vidro do KingdomBadge.

export const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crownGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff6d5" />
        <stop offset="55%" stopColor="#f5c542" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
    </defs>
    <path
      d="M3 18L2 8l5 4 5-7 5 7 5-4-1 10H3z"
      fill="url(#crownGold)"
      stroke="#8a6300"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <rect x="3" y="18" width="18" height="2.4" rx="0.6" fill="url(#crownGold)" stroke="#8a6300" strokeWidth="0.6" />
    <circle cx="12" cy="5" r="1.15" fill="#fff6d5" stroke="#8a6300" strokeWidth="0.4" />
    <circle cx="2.4" cy="7.4" r="0.9" fill="#fff6d5" stroke="#8a6300" strokeWidth="0.4" />
    <circle cx="21.6" cy="7.4" r="0.9" fill="#fff6d5" stroke="#8a6300" strokeWidth="0.4" />
  </svg>
);

export const OpenBookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bookGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff6d5" />
        <stop offset="100%" stopColor="#d9a441" />
      </linearGradient>
      <radialGradient id="bookLight" cx="50%" cy="20%" r="65%">
        <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#fff8e1" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="12" cy="10" rx="9" ry="7" fill="url(#bookLight)" />
    <path
      d="M12 6.5c-1.8-1.3-4.4-1.7-7-1.1v11c2.6-.6 5.2-.2 7 1.1 1.8-1.3 4.4-1.7 7-1.1v-11c-2.6-.6-5.2-.2-7 1.1z"
      fill="url(#bookGold)"
      stroke="#8a6300"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
    <path d="M12 6.5v11" stroke="#8a6300" strokeWidth="0.5" />
    <path d="M6.5 7.6c1.4-.35 2.9-.3 4.2.15M6.5 10c1.4-.35 2.9-.3 4.2.15M6.5 12.4c1.4-.35 2.9-.3 4.2.15" stroke="#8a6300" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
    <path d="M17.5 7.6c-1.4-.35-2.9-.3-4.2.15M17.5 10c-1.4-.35-2.9-.3-4.2.15M17.5 12.4c-1.4-.35-2.9-.3-4.2.15" stroke="#8a6300" strokeWidth="0.4" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const GenerousHeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="heartWarm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffd9b3" />
        <stop offset="55%" stopColor="#f5a45c" />
        <stop offset="100%" stopColor="#c2542a" />
      </linearGradient>
    </defs>
    <path
      d="M12 20.2s-7.6-4.6-9.9-9.3C.6 7.2 2.6 3.8 6 3.4c2-.25 3.7.7 6 3 2.3-2.3 4-3.25 6-3 3.4.4 5.4 3.8 3.9 7.5-2.3 4.7-9.9 9.3-9.9 9.3z"
      fill="url(#heartWarm)"
      stroke="#8a4318"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <g stroke="#fff2df" strokeWidth="0.5" strokeLinecap="round" opacity="0.85">
      <path d="M6 6.5l0.6 0.6M17.4 6.6l-0.6 0.6M12 4.4v0.9" />
    </g>
  </svg>
);
