export function TomatoDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="34" r="24" fill="#E7334A" />
      <circle cx="32" cy="34" r="18" fill="#F25466" />
      <path d="M32 21v26M21 27l22 14M43 27 21 41" stroke="#FFC0AA" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 12c-1-4 2-7 6-7-1 3-3 5-6 7Zm0 0c-3-3-7-3-9-1 2 2 5 3 9 1Z" fill="#4E8D3A" />
    </svg>
  );
}

export function BasilDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 58C12 44 12 20 30 6c16 12 20 30 2 52Z" fill="#4E8D3A" />
      <path d="M32 57c-7-20-4-36 0-48" stroke="#8CC45A" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 44c-6-3-9-8-10-14M33 36c5-2 8-6 9-11M31 28c-4-2-6-5-7-9" stroke="#8CC45A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function OliveDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="36" rx="22" ry="17" fill="#4A3038" transform="rotate(-18 32 36)" />
      <ellipse cx="32" cy="36" rx="11" ry="8" fill="#B98A6E" transform="rotate(-18 32 36)" />
      <ellipse cx="32" cy="36" rx="5" ry="3.5" fill="#3A232B" transform="rotate(-18 32 36)" />
      <path d="M39 20c3-6 9-8 14-6-2 5-7 8-14 6Z" fill="#4E8D3A" />
    </svg>
  );
}

export function CheeseDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M9 22 51 12l4 33-40 9-6-32Z" fill="#FFC93C" />
      <path d="M9 22 51 12l1 6-40 9-3-5Z" fill="#FFE28C" />
      <circle cx="24" cy="33" r="4" fill="#F1A822" />
      <circle cx="41" cy="29" r="2.8" fill="#F1A822" />
      <circle cx="35" cy="44" r="3.2" fill="#F1A822" />
      <circle cx="19" cy="45" r="2" fill="#F1A822" />
    </svg>
  );
}
