/** A small live dot: steady, or pinging when something needs eyes. */
export function LiveDot({ color, ping = false }: { color: string; ping?: boolean }) {
  return (
    <span className="relative flex size-1.5 shrink-0">
      {ping ? <span className="absolute inset-0 animate-ping rounded-full opacity-70" style={{ background: color }} /> : null}
      <span className="relative size-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

/** m:ss for a count of seconds. */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** HH:MM:SS of a date, 24 h. */
export const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
