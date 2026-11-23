import { ArrowMinimize16Regular, VideoOff16Regular, VideoSecurity20Filled } from "@fluentui/react-icons";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { LiveDot } from "./_parts";

type Kind = "lobby" | "parking" | "dock" | "servers" | "fence" | "stair";
type Cam = {
  id: Kind;
  name: string;
  spec: string;
  status: "live" | "offline";
  alert?: { label: string; tone: "red" | "orange" };
};

const CAMS: Cam[] = [
  { id: "lobby", name: "Lobby · North", spec: "4K · 15 fps · 5.8 Mbps", status: "live" },
  { id: "parking", name: "Parking P1", spec: "1080p · 15 fps · 2.4 Mbps", status: "live" },
  { id: "dock", name: "Loading Dock 2", spec: "1080p · 15 fps · 2.1 Mbps", status: "live", alert: { label: "Door held", tone: "orange" } },
  { id: "servers", name: "Server Room B2", spec: "1080p · 10 fps · 1.6 Mbps", status: "live", alert: { label: "Forced door", tone: "red" } },
  { id: "fence", name: "East Fence", spec: "Last seen 11:23:08", status: "offline" },
  { id: "stair", name: "Stair C · L4", spec: "1080p IR · 10 fps · 1.2 Mbps", status: "live" },
];

const OFFLINE_SINCE_S = 3 * 3600 + 12 * 60;
const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const age = (s: number) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;

/** Security · large. A six-camera wall of CCTV-treated photo feeds: timestamps tick, scanlines and grain roll, alarming tiles pulse, the dead camera freezes under static; tap a tile to expand it and tap again to return. */
export function CameraWallWidget({ index }: { index?: number }) {
  const [now, setNow] = useState(() => new Date());
  const [elapsed, setElapsed] = useState(0);
  const [focus, setFocus] = useState<Kind | null>(null);
  const settled = useRef(false);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setNow(new Date());
      setElapsed((e) => e + 1);
    }, 1000);
    const s = window.setTimeout(() => (settled.current = true), 1500);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(s);
    };
  }, []);

  const cams = focus ? CAMS.filter((c) => c.id === focus) : CAMS;
  const focused = focus ? CAMS.find((c) => c.id === focus)! : null;

  return (
    <Widget size="large" index={index} label="Camera wall">
      <WidgetHeader
        icon={<VideoSecurity20Filled />}
        tint="var(--ios-indigo)"
        title="Cameras · HQ"
        subtitle={focused ? focused.spec : "Live view · 6 of 250"}
        extra={
          focused ? (
            <motion.button
              type="button"
              aria-label="Back to grid"
              onClick={() => setFocus(null)}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              className="grid size-7 cursor-pointer place-items-center rounded-full bg-fill-secondary text-heading"
            >
              <ArrowMinimize16Regular />
            </motion.button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-ios-red/15 px-2 py-0.5 text-[11px] font-semibold text-ios-red">
              <LiveDot color="var(--ios-red)" ping />
              LIVE
            </span>
          )
        }
      />

      <LayoutGroup>
        <div className="mt-2.5 grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-1.5">
          <AnimatePresence mode="popLayout">
            {cams.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                layout
                aria-label={focus ? `Close ${c.name}` : `Expand ${c.name}`}
                onClick={() => setFocus((f) => (f === c.id ? null : c.id))}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                whileHover={{ scale: focus ? 1 : 1.02 }}
                transition={{
                  layout: { type: "spring", stiffness: 320, damping: 32 },
                  default: { type: "spring", stiffness: 300, damping: 26, delay: settled.current ? i * 0.03 : delay + i * 0.06 },
                }}
                className="relative min-h-0 cursor-pointer overflow-hidden bg-[#14181d] text-left"
                style={{ borderRadius: 10, gridColumn: focus ? "1 / -1" : undefined, gridRow: focus ? "1 / -1" : undefined }}
              >
                <Tile cam={c} time={clock(now)} offlineFor={OFFLINE_SINCE_S + elapsed} expanded={!!focus} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <div className="mt-2.5 flex items-center gap-2 whitespace-nowrap text-[11px] text-tertiary">
        <LiveDot color="var(--ios-green)" />
        <span>
          <AnimatedNumber value={247} className="font-semibold text-secondary" />/250 online
        </span>
        <span className="text-ios-orange">· 3 offline</span>
        <span className="ml-auto flex min-w-0 items-center gap-1.5">
          <MemojiAvatar who="Dana Kim" size={20} alt="Dana Kim" />
          <span className="truncate">Dana K. · on duty</span>
        </span>
      </div>
    </Widget>
  );
}

function Tile({ cam, time, offlineFor, expanded }: { cam: Cam; time: string; offlineFor: number; expanded: boolean }) {
  const offline = cam.status === "offline";
  return (
    <>
      <Scene kind={cam.id} offline={offline} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,transparent_32%,transparent_68%,rgba(0,0,0,0.5)_100%)]" />

      <div className="pointer-events-none absolute inset-x-2 top-1.5 flex items-center gap-1.5">
        <span className="shrink-0 rounded-[3px] bg-black/45 px-1 font-mono text-[9px] font-semibold text-white/85 tabular">
          CAM {String(CAMS.indexOf(cam) + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{cam.name}</span>
        {offline ? null : <RecDot />}
      </div>

      <div className="pointer-events-none absolute inset-x-2 bottom-1.5 flex items-end justify-between gap-1">
        <span className="font-mono text-[9px] text-white/80 tabular [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{offline ? "--:--:--" : time}</span>
        {cam.alert ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[9px] font-semibold",
              cam.alert.tone === "red" ? "bg-ios-red text-white" : "bg-ios-orange/15 text-ios-orange",
            )}
          >
            {cam.alert.label}
          </span>
        ) : expanded ? (
          <span className="text-[9px] text-white/75">{cam.spec}</span>
        ) : null}
      </div>

      {offline ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-lg bg-black/55 px-2 py-1 text-center leading-tight text-white">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold">
              <VideoOff16Regular className="size-3.5" /> No signal
            </div>
            <div className="text-[9px] text-white/70 tabular">Offline {age(offlineFor)}</div>
          </div>
        </div>
      ) : null}

      {cam.alert?.tone === "red" ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px] ring-2 ring-inset ring-ios-red"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : offline ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-ios-orange/60" />
      ) : null}
    </>
  );
}

function RecDot() {
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-white/90">
      <motion.span
        className="size-1.5 rounded-full bg-ios-red"
        animate={{ opacity: [1, 1, 0.15, 0.15] }}
        transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.55, 1] }}
      />
      REC
    </span>
  );
}

/**
 * Camera footage: real photos from Unsplash (free Unsplash License, no attribution
 * required), all empty spaces with no identifiable people. The CCTV look (desaturation,
 * scanlines, grain, vignette, a slow exposure sweep) is layered on top in CSS.
 */
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=640&h=400&fit=crop&auto=format&q=60`;

const FEED: Record<Kind, { src: string; filter: string; fallback: string; pos?: string }> = {
  // "Empty building lobby" by Steven Binotto.
  lobby: { src: unsplash("1558203195-8da1208936f0"), filter: "saturate(0.45) contrast(1.08) brightness(0.95)", fallback: "linear-gradient(180deg,#4a3a30,#15110e)" },
  // "An empty parking garage with yellow and black stripes" by Jakub Żerdzicki.
  parking: { src: unsplash("1707903286963-ccf1300c61e5"), filter: "saturate(0.4) contrast(1.05) brightness(0.85)", fallback: "linear-gradient(180deg,#5a6168,#1c2024)" },
  // Warehouse loading gate with the shutter down, at night.
  dock: { src: unsplash("1736334667060-f6e42dd444b1"), filter: "saturate(0.5) contrast(1.1) brightness(1.15)", fallback: "linear-gradient(180deg,#30353d,#111317)" },
  // Server racks in a dark data hall by Taylor Vick.
  servers: { src: unsplash("1558494949-ef010cbdcc31"), filter: "saturate(0.55) contrast(1.05) brightness(1.1)", fallback: "linear-gradient(180deg,#1d2a33,#0b1014)" },
  // "Razor wire sits atop a tall, protective fence" by Ben Marler (frozen last frame).
  fence: { src: unsplash("1749584819951-57d8ff04b333"), filter: "grayscale(1) contrast(0.9) brightness(0.55) blur(1px)", fallback: "linear-gradient(180deg,#3a3f45,#1d2024)" },
  // "A gray staircase in an empty, modern hallway" by Jakub Żerdzicki, as an IR (monochrome) feed.
  stair: { src: unsplash("1754494977459-f5bf1acf0689"), filter: "grayscale(1) contrast(1.15) brightness(0.8)", fallback: "linear-gradient(180deg,#4a4f4c,#1a1c1b)", pos: "60% 50%" },
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** A photo feed with a CCTV treatment. Fixed dark palettes: these are video surfaces, not theme surfaces. */
function Scene({ kind, offline }: { kind: Kind; offline: boolean }) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const f = FEED[kind];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: f.fallback }}>
      {failed ? null : (
        <motion.img
          src={f.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
          style={{ filter: f.filter, objectPosition: f.pos ?? "50% 50%" }}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={
            offline || reduce
              ? { opacity: 1, scale: 1.06 }
              : { opacity: 1, scale: [1.06, 1.1, 1.06], x: ["0%", "-1.5%", "0%"] }
          }
          transition={{
            opacity: { duration: 0.5 },
            default: offline || reduce ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      )}

      {/* Sensor tint: a faint green-gray cast like a cheap CCTV sensor. */}
      <div className="absolute inset-0 bg-[#7d9a86] opacity-[0.12] mix-blend-color" />
      {/* Scanlines. */}
      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.55)_0px,rgba(0,0,0,0.55)_1px,transparent_1px,transparent_3px)]" />
      {/* Grain; the dead camera gets heavy, jittering static instead. */}
      <motion.div
        className="absolute -inset-6"
        style={{ backgroundImage: GRAIN, backgroundSize: "120px 120px", opacity: offline ? 0.55 : 0.14, mixBlendMode: "overlay" }}
        animate={reduce ? undefined : { x: [0, -8, 4, -3, 0], y: [0, 5, -6, 3, 0] }}
        transition={{ duration: offline ? 0.4 : 1.2, repeat: Infinity, ease: "linear" }}
      />
      {/* A slow exposure sweep rolling down the frame. */}
      {offline ? null : (
        <motion.div
          className="absolute inset-x-0 top-0 h-1/4 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.07),transparent)]"
          initial={{ y: "-100%" }}
          animate={reduce ? { y: "-100%" } : { y: "400%" }}
          transition={reduce ? { duration: 0 } : { duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      )}
      {/* Lens vignette. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
