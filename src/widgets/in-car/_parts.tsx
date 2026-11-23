/* Shared drawings for the in-car widgets. */

/** A top-down car in a 120 × 220 box, nose up. Every closure is its own path. */
export const CAR = {
  w: 120,
  h: 220,
  body: "M60 10 C80 10 94 16 96 34 L98 70 C99 105 99 140 98 172 L96 196 C94 208 80 211 60 211 C40 211 26 208 24 196 L22 172 C21 140 21 105 22 70 L24 34 C26 16 40 10 60 10 Z",
  frunk: "M60 14 C78 14 89 19 91 33 L93 61 Q60 55 27 61 L29 33 C31 19 42 14 60 14 Z",
  windshield: "M29 67 Q60 59 91 67 L87 94 Q60 88 33 94 Z",
  roof: "M33 98 Q60 94 87 98 L87 150 Q60 154 33 150 Z",
  rear: "M33 154 Q60 158 87 154 L91 174 Q60 180 29 174 Z",
  trunk: "M27 179 Q60 185 93 179 L94 195 C92 204 80 207 60 207 C40 207 28 204 26 195 Z",
  /** Top-left corner of each 9 × 30 wheel. */
  wheels: { fl: [15.5, 38], fr: [95.5, 38], rl: [15.5, 146], rr: [95.5, 146] },
} as const;

/** A steering wheel, the driver-assist glyph (Fluent has none). */
export function WheelGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="10" cy="10" r="7.6" />
      <circle cx="10" cy="10.6" r="2.1" fill="currentColor" stroke="none" />
      <path d="M2.6 9.2 Q10 7 17.4 9.2 M10 12.6 V17.5" strokeLinecap="round" />
    </svg>
  );
}

/** A three-blade fan, drawn so it can spin around its centre. */
export function FanGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      {[0, 120, 240].map((r) => (
        <path key={r} transform={`rotate(${r} 12 12)`} d="M12 10.4 C11 6.5 11.6 2.6 14.6 2.4 C17.4 2.2 17.4 6.4 13.6 10.6 Z" />
      ))}
      <circle cx="12" cy="12" r="1.9" />
    </svg>
  );
}

/** A windscreen with heat lines rising off it. */
export function DefrostGlyph({ className, rear }: { className?: string; rear?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      {rear ? <rect x="2.5" y="11.5" width="15" height="6" rx="1.6" /> : <path d="M2.5 17.5 Q10 12.5 17.5 17.5" />}
      <path d="M6 11 q-1.6 -1.8 0 -3.6 q1.6 -1.8 0 -3.6 M10 10.5 q-1.6 -1.8 0 -3.6 q1.6 -1.8 0 -3.6 M14 11 q-1.6 -1.8 0 -3.6 q1.6 -1.8 0 -3.6" />
    </svg>
  );
}

/** A side-on seat, used with stacked heat lines. */
export function SeatGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.6 3 L7.2 5.2" />
      <path d="M8 8.6 L10.2 17.6 H18.6" />
    </svg>
  );
}
