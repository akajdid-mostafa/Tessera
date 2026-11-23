import { Call12Filled, Chat12Filled, Mail12Filled } from "@fluentui/react-icons";
import { cn } from "@/registry/antuikit/lib/utils";

/* Shared bits of the tour-guest widgets in `_entries-b.ts`. */

/** The inbox channels a conversation can arrive on (contracts: `whatsapp | instagram | chat | email`). */
export type Channel = "whatsapp" | "instagram" | "chat" | "email";

export const CHANNEL_LABEL: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  chat: "Site chat",
  email: "E-mail",
};

const CHANNEL_BG: Record<Channel, string> = {
  whatsapp: "var(--ios-green)",
  instagram: "linear-gradient(45deg, #FEDA75 0%, #FA7E1E 30%, #D62976 60%, #962FBF 100%)",
  chat: "var(--ios-blue)",
  email: "var(--ios-indigo)",
};

/** A camera-in-a-rounded-square mark for Instagram, drawn so no brand asset is loaded. */
function CameraMark() {
  return (
    <svg viewBox="0 0 12 12" className="size-[62%]" fill="none" stroke="white" strokeWidth="1.3">
      <rect x="1.5" y="1.5" width="9" height="9" rx="2.6" />
      <circle cx="6" cy="6" r="2.1" />
      <circle cx="8.6" cy="3.4" r="0.5" fill="white" stroke="none" />
    </svg>
  );
}

/** A round channel badge: WhatsApp, Instagram, site chat or e-mail. */
export function ChannelGlyph({ channel, size = 18, className }: { channel: Channel; size?: number; className?: string }) {
  const inner =
    channel === "instagram" ? (
      <CameraMark />
    ) : channel === "whatsapp" ? (
      <Call12Filled className="size-[58%]" />
    ) : channel === "chat" ? (
      <Chat12Filled className="size-[58%]" />
    ) : (
      <Mail12Filled className="size-[58%]" />
    );
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center text-white",
        channel === "instagram" ? "rounded-[32%]" : "rounded-full",
        className,
      )}
      style={{ width: size, height: size, background: CHANNEL_BG[channel] }}
      aria-label={CHANNEL_LABEL[channel]}
    >
      {inner}
    </span>
  );
}

/** Minutes and seconds, `4:07`; hours once past the hour, `1:02:07`. */
export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
