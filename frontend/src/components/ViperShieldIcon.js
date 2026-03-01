/**
 * Shield icon with a snake coiled inside — the ViperProtection brand mark.
 * Self-contained colours; works on any background.
 */
export default function ViperShieldIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Green shield */}
      <path
        d="M16 3L5.5 7V15C5.5 22.3 10 27.5 16 29.5C22 27.5 26.5 22.3 26.5 15V7L16 3Z"
        fill="#22c55e"
      />

      {/* Snake body — S-curve */}
      <path
        d="M16 24 C9 24 9 17 16 17 C23 17 23 11 16 11"
        stroke="#052e16"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Snake head */}
      <circle cx="16" cy="9" r="2" fill="#052e16" />

      {/* Forked tongue */}
      <path
        d="M15.3 7.2 L14 5.6 M16.7 7.2 L18 5.6"
        stroke="#052e16"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
