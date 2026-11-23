import { ChevronDown16Filled, ChevronUp16Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion, useAnimationFrame, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { WheelGlyph } from "./_parts";

/* The scene fills the whole card (408 × 408 with padding) behind the readouts.
 * Road space: u = lateral offset in lanes (ego lane centre 0), d = distance ahead.
 * A point projects with a simple pinhole: s = D0 / (D0 + d). */
const VW = 408;
const HORIZON = 72;
const NEAR_Y = 480;
const D0 = 6;
const LANE = 176;
/** The lane width the local car drawing is made for. */
const CAR_LANE = 135;
const EGO_D = 3.1;
const LEAD_D = 10.5;
const DASH_GAP = 4.6;
const DASH_LEN = 1.9;

const sOf = (d: number) => D0 / (D0 + d);
const py = (d: number) => HORIZON + (NEAR_Y - HORIZON) * sOf(d);
const px = (u: number, d: number) => VW / 2 + u * LANE * sOf(d);
const f = (n: number) => n.toFixed(1);
const quad = (u: number, w: number, d1: number, d2: number) =>
  `M${f(px(u - w, d1))} ${f(py(d1))}L${f(px(u + w, d1))} ${f(py(d1))}L${f(px(u + w, d2))} ${f(py(d2))}L${f(px(u - w, d2))} ${f(py(d2))}Z`;

const ROAD = `M${f(px(-1.7, 0))} ${NEAR_Y}L${f(px(1.7, 0))} ${NEAR_Y}L${f(px(1.7, 90))} ${f(py(90))}L${f(px(-1.7, 90))} ${f(py(90))}Z`;
const EDGES = quad(-1.5, 0.03, 0, 90) + quad(1.5, 0.03, 0, 90);
const EGO_LANE = `M${f(px(-0.5, EGO_D - 0.6))} ${f(py(EGO_D - 0.6))}L${f(px(0.5, EGO_D - 0.6))} ${f(py(EGO_D - 0.6))}L${f(px(0.5, LEAD_D))} ${f(py(LEAD_D))}L${f(px(-0.5, LEAD_D))} ${f(py(LEAD_D))}Z`;

function dashes(off: number) {
  let d = "";
  for (const u of [-0.5, 0.5]) {
    for (let k = 0; k < 18; k++) {
      const d1 = k * DASH_GAP - off;
      const d2 = d1 + DASH_LEN;
      if (d2 <= 0) continue;
      d += quad(u, 0.024, Math.max(d1, 0), d2);
    }
  }
  return d;
}

/** Floating guidance chevrons in the ego lane, between the ego car and the lead car. */
function chevrons(off: number) {
  let d = "";
  for (let k = 0; k < 3; k++) {
    const dd = EGO_D + 1.4 + ((k * 2 + off) % 6);
    const tip = dd + 0.55;
    d += `M${f(px(-0.16, dd))} ${f(py(dd))}L${f(px(0, tip))} ${f(py(tip))}L${f(px(0.16, dd))} ${f(py(dd))}`;
  }
  return d;
}

type Other = { id: string; truck?: boolean; u: (t: number) => number; d: (t: number) => number };
/* Painted far to near; each car keeps to its own depth band so the order holds. */
const OTHERS: Other[] = [
  { id: "far-r", u: () => 1, d: (t) => 36 + 5 * Math.sin(t / 7000 + 2) },
  { id: "far-l", u: () => -1, d: (t) => 25 + 4 * Math.sin(t / 6100 + 1) },
  { id: "truck", truck: true, u: () => 1.02, d: (t) => 15.5 + 2.4 * Math.sin(t / 8000) },
  { id: "lead", u: (t) => 0.025 * Math.sin(t / 1900), d: (t) => LEAD_D + 0.8 * Math.sin(t / 3300) },
  { id: "left", u: (t) => -1 + 0.07 * Math.sin(t / 2600), d: (t) => 5.2 + 2.1 * Math.sin(t / 5200) },
];

function carTransform(u: number, d: number) {
  const s = sOf(d);
  const sx = (LANE * s) / CAR_LANE;
  const sy = sx * (0.35 + 0.65 * s);
  return `translate(${f(px(u, d))} ${f(py(d))}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`;
}

/* Cars in the style of a production driver-assist visualization: smooth
 * light-gray bodies seen from behind and above, a dark glass canopy that runs
 * from the rear window over the roof, wrap-around tail lights and a soft
 * contact shadow. Drawn bottom-centre at the origin, y grows up the road
 * (negative). Shading lives in the gradients defined in <CarDefs />. */
type Tone = "ego" | "other";

/* Sedan: rear corners at y 0, widest over the rear wheels, tapering to the nose. */
const SEDAN_BODY =
  "M-27 0C-32.5 0-34-3-34-8L-34-22C-34-31-32.2-44-30.2-52C-28.6-58.2-24-62-16-62L16-62C24-62 28.6-58.2 30.2-52C32.2-44 34-31 34-22L34-8C34-3 32.5 0 27 0Z";
/* The rear face (bumper and trunk lid) seen at an angle. */
const SEDAN_REAR = "M-27 0C-32.5 0-34-3-34-8L-34-14.5C-23-18 23-18 34-14.5L34-8C34-3 32.5 0 27 0Z";
/* One continuous glass canopy: rear window, glass roof, top of the windshield. */
const SEDAN_GLASS =
  "M-24.5-21.5C-14-24.2 14-24.2 24.5-21.5L22.6-43.5C22-47.6 19-50.4 14.5-50.8L-14.5-50.8C-19-50.4-22-47.6-22.6-43.5Z";
const SEDAN_GLINT = "M-17.5-26.5C-8-28 6-28.4 13-28L9.5-45.5C2-46.2-6-46-12.5-45.2Z";
const TAIL_L = "M-33.4-13.4C-29-14.6-25-15.3-20.5-15.6L-20-13.2C-24.6-12.7-29-11.8-33-10.4Z";
const TAIL_R = "M33.4-13.4C29-14.6 25-15.3 20.5-15.6L20-13.2C24.6-12.7 29-11.8 33-10.4Z";

const TRUCK_BODY = "M-36 0C-39 0-40-2-40-5L-40-104C-40-106.4-38.4-108-36-108L36-108C38.4-108 40-106.4 40-104L40-5C40-2 39 0 36 0Z";
const TRUCK_REAR = "M-36 0C-39 0-40-2-40-5L-40-34L40-34L40-5C40-2 39 0 36 0Z";

function CarDefs() {
  return (
    <>
      <radialGradient id="dv-shadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.7" />
        <stop offset="60%" stopColor="#000" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {/* Side-to-side shading makes the body read as rounded. */}
      <linearGradient id="dv-body-ego" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8f99a8" />
        <stop offset="0.2" stopColor="#dfe4ea" />
        <stop offset="0.5" stopColor="#fbfcfd" />
        <stop offset="0.8" stopColor="#dfe4ea" />
        <stop offset="1" stopColor="#8f99a8" />
      </linearGradient>
      <linearGradient id="dv-body-other" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#59626f" />
        <stop offset="0.2" stopColor="#9aa3af" />
        <stop offset="0.5" stopColor="#c3c9d1" />
        <stop offset="0.8" stopColor="#9aa3af" />
        <stop offset="1" stopColor="#59626f" />
      </linearGradient>
      <linearGradient id="dv-rear-ego" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e3e8ee" />
        <stop offset="1" stopColor="#8a94a3" />
      </linearGradient>
      <linearGradient id="dv-rear-other" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a4acb7" />
        <stop offset="1" stopColor="#4e5764" />
      </linearGradient>
      <linearGradient id="dv-glass" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#070b12" />
        <stop offset="0.55" stopColor="#141c2a" />
        <stop offset="1" stopColor="#3b4a63" />
      </linearGradient>
    </>
  );
}

/** A car (or box truck) seen from behind and above. `ego` adds rim light and reflections; `target` tints the lead car. */
function CarShape({ tone, truck, target }: { tone: Tone; truck?: boolean; target?: boolean }) {
  const ego = tone === "ego";
  const w = truck ? 40 : 34;
  const body = `url(#dv-body-${tone})`;
  const rear = `url(#dv-rear-${tone})`;
  return (
    <>
      <ellipse cx="0" cy={truck ? -10 : -6} rx={w + 12} ry={truck ? 18 : 13} fill="url(#dv-shadow)" />
      <ellipse cx="0" cy="-0.5" rx={w + 1} ry="3.5" fill="#000" opacity="0.55" />
      {/* Tires peeking below the bumper */}
      <rect x={-(w - 2)} y="-3" width={truck ? 12 : 8} height="5.5" rx="2" fill="#05070b" />
      <rect x={w - (truck ? 14 : 10)} y="-3" width={truck ? 12 : 8} height="5.5" rx="2" fill="#05070b" />
      {truck ? (
        <>
          <path d={TRUCK_BODY} fill={body} />
          {/* Roof ribs */}
          <path d="M-36-96H36M-36-84H36M-36-72H36M-36-60H36M-36-48H36" stroke="#000" strokeOpacity="0.1" strokeWidth="1.2" />
          <path d={TRUCK_REAR} fill={rear} />
          <path d="M0-33V-7M-20-30V-10M20-30V-10" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" />
          <rect x="-34" y="-8" width="68" height="3.2" rx="1.6" fill="#0b0f16" opacity="0.8" />
          <rect x="-38" y="-14" width="5" height="8" rx="1.5" fill="#ff453a" />
          <rect x="33" y="-14" width="5" height="8" rx="1.5" fill="#ff453a" />
          <path d={TRUCK_BODY} fill="#5cc8ff" opacity={target ? 0.4 : 0} style={{ transition: "opacity .5s" }} />
        </>
      ) : (
        <>
          <path d={SEDAN_BODY} fill={body} />
          {/* Side mirrors at the base of the windshield */}
          <ellipse cx="-31.5" cy="-48" rx="3.6" ry="2.2" fill={rear} />
          <ellipse cx="31.5" cy="-48" rx="3.6" ry="2.2" fill={rear} />
          <path d={SEDAN_REAR} fill={rear} />
          <path d={SEDAN_BODY} fill="#5cc8ff" opacity={target ? 0.42 : 0} style={{ transition: "opacity .5s" }} />
          <path d={SEDAN_GLASS} fill="url(#dv-glass)" />
          <path d={SEDAN_GLINT} fill="#fff" opacity={ego ? 0.1 : 0.06} />
          {/* Hood highlight */}
          <ellipse cx="0" cy="-56.5" rx="13" ry="3" fill="#fff" opacity={ego ? 0.35 : 0.12} />
          <path d={TAIL_L} fill="#ff453a" />
          <path d={TAIL_R} fill="#ff453a" />
          <rect x="-20" y="-3.6" width="40" height="2.4" rx="1.2" fill="#000" opacity="0.28" />
          {ego ? (
            <>
              {/* Rim light along the canopy and the trunk lip */}
              <path d={SEDAN_GLASS} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" />
              <path d="M-30-16.2C-18-19.4 18-19.4 30-16.2" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1" />
              <path d={TAIL_L} fill="#ff453a" opacity="0.35" transform="translate(0 0.6) scale(1.08)" />
              <path d={TAIL_R} fill="#ff453a" opacity="0.35" transform="translate(0 0.6) scale(1.08)" />
            </>
          ) : null}
        </>
      )}
    </>
  );
}

type Assist = "off" | "active" | "nudge" | "takeover";

const COPY: Record<Assist, { title: string; sub: string; action: string }> = {
  off: { title: "Assist available", sub: "Lane keeping ready · Gap 3", action: "Engage" },
  active: { title: "Assist active", sub: "Navigate on assist · Hands on", action: "Disengage" },
  nudge: { title: "Hold the steering wheel", sub: "Light torque needed to stay on", action: "Holding" },
  takeover: { title: "Take over now", sub: "Assist is slowing the car", action: "Take control" },
};

/** In-car · large. A glass-cockpit driving view: lanes stream at you, traffic drifts and the assist state lives in the dock. */
export function DriveViewWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [assist, setAssist] = useState<Assist>("active");
  const [setSpeed, setSetSpeed] = useState(100);
  const [speed, setSpeedNow] = useState(0);
  const dashRef = useRef<SVGPathElement>(null);
  const chevRef = useRef<SVGPathElement>(null);
  const cars = useRef<Record<string, SVGGElement | null>>({});
  const on = assist === "active" || assist === "nudge";

  useAnimationFrame((time) => {
    const t = reduce ? 0 : time;
    dashRef.current?.setAttribute("d", dashes(((t / 1000) * 7.5) % DASH_GAP));
    chevRef.current?.setAttribute("d", chevrons(((t / 1000) * 2.4) % 6));
    for (const o of OTHERS) cars.current[o.id]?.setAttribute("transform", carTransform(o.u(t), o.d(t)));
  });

  // Hands-on monitoring: a quiet stretch, then a nudge, then a takeover request.
  useEffect(() => {
    if (assist !== "active" && assist !== "nudge") return;
    const t = window.setTimeout(() => setAssist(assist === "active" ? "nudge" : "takeover"), assist === "active" ? 16000 : 7000);
    return () => window.clearTimeout(t);
  }, [assist]);

  useEffect(() => {
    const first = window.setTimeout(() => setSpeedNow(87), 300 + (index ?? 0) * 60);
    const t = window.setInterval(() => {
      setSpeedNow((v) => {
        if (v === 0) return v;
        const target = assist === "takeover" ? 64 : on ? Math.min(setSpeed, 88) : 86;
        const step = Math.max(-3, Math.min(2, target - v));
        return Math.round(v + step + (Math.random() - 0.5) * 1.4);
      });
    }, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [assist, on, setSpeed, index]);

  const act = () =>
    setAssist((a) => (a === "off" ? "active" : a === "active" ? "off" : a === "nudge" ? "active" : "off"));
  const copy = COPY[assist];

  return (
    <Widget
      size="large"
      index={index}
      label="Driving visualization"
      surfaceClassName="bg-[linear-gradient(180deg,#0d1726_0%,#08101c_45%,#04070d_100%)] ring-white/10"
      glow={{ mode: "pulse", colors: ["#FF453A", "#FF9F0A", "#FF453A"], blur: 22, duration: 1 }}
      glowActive={assist === "takeover"}
    >
      <svg viewBox="0 0 408 408" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id="dv-sky" cx="50%" cy="16%" r="60%">
            <stop offset="0%" stopColor="#3a7bd5" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3a7bd5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dv-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b2536" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1f2a3c" />
          </linearGradient>
          <linearGradient id="dv-lane" gradientUnits="userSpaceOnUse" x1="0" y1={py(EGO_D)} x2="0" y2={py(LEAD_D)}>
            <stop offset="0%" stopColor="#2aa8ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2aa8ff" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="dv-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.72" stopColor="#04070d" stopOpacity="0" />
            <stop offset="1" stopColor="#04070d" stopOpacity="0.9" />
          </linearGradient>
          <CarDefs />
        </defs>
        <rect width="408" height="408" fill="url(#dv-sky)" />
        <path d={ROAD} fill="url(#dv-road)" />
        <motion.path d={EGO_LANE} fill="url(#dv-lane)" initial={false} animate={{ opacity: on ? 1 : 0 }} transition={{ duration: 0.6 }} />
        <path d={EDGES} fill="#c9d3e3" opacity="0.55" />
        <path
          ref={dashRef}
          d={dashes(0)}
          fill={on ? "#5cc8ff" : "#c9d3e3"}
          opacity={on ? 0.95 : 0.5}
          style={{ transition: "fill .5s, opacity .5s" }}
        />
        <motion.path
          ref={chevRef}
          d={chevrons(0)}
          fill="none"
          stroke="#7fdcff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ opacity: assist === "active" ? 0.55 : 0 }}
        />
        {OTHERS.map((o) => (
          <g key={o.id} ref={(el) => void (cars.current[o.id] = el)} transform={carTransform(o.u(0), o.d(0))}>
            <CarShape tone="other" truck={o.truck} target={o.id === "lead" && on} />
          </g>
        ))}
        <g transform={carTransform(0, EGO_D)}>
          <CarShape tone="ego" />
        </g>
        <rect width="408" height="408" fill="url(#dv-fade)" />
      </svg>

      <div className="relative flex h-full flex-col text-white">
        <div className="flex items-start justify-between">
          <div className="leading-none">
            <div className="text-[44px] font-semibold tracking-tighter">
              <AnimatedNumber value={speed} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-white/55">km/h</span>
              <span className="flex gap-1 font-semibold">
                {["P", "R", "N", "D"].map((g) => (
                  <span key={g} className={g === "D" ? "text-white" : "text-white/30"}>
                    {g}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="grid size-[38px] place-items-center rounded-full bg-white ring-[3.5px] ring-ios-red ring-inset">
              <span className="text-[15px] font-bold tracking-tight text-black tabular">90</span>
            </div>
            <div className="flex w-[42px] flex-col items-center rounded-xl bg-white/[0.08] py-0.5 ring-1 ring-white/10 backdrop-blur-md">
              <button
                type="button"
                aria-label="Raise set speed"
                onClick={() => setSetSpeed((v) => Math.min(130, v + 5))}
                className="grid h-4 w-full cursor-pointer place-items-center text-white/60 outline-none hover:text-white"
              >
                <ChevronUp16Filled className="text-[12px]" />
              </button>
              <AnimatedNumber value={setSpeed} className={cn("text-[15px] leading-none font-semibold", on ? "text-[#6fd6ff]" : "text-white")} />
              <span className="text-[9px] font-semibold tracking-wide text-white/45">SET</span>
              <button
                type="button"
                aria-label="Lower set speed"
                onClick={() => setSetSpeed((v) => Math.max(60, v - 5))}
                className="grid h-4 w-full cursor-pointer place-items-center text-white/60 outline-none hover:text-white"
              >
                <ChevronDown16Filled className="text-[12px]" />
              </button>
            </div>
          </div>
        </div>

        <motion.div
          className={cn(
            "mt-auto flex h-11 shrink-0 items-center gap-2 rounded-2xl pr-1.5 pl-1.5 ring-1 backdrop-blur-md transition-colors duration-500",
            assist === "takeover"
              ? "bg-[#3a0d0d]/80 ring-ios-red/60"
              : assist === "nudge"
                ? "bg-[#33210a]/80 ring-ios-orange/50"
                : "bg-[#0b1424]/75 ring-white/10",
          )}
          animate={assist === "takeover" && !reduce ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
          transition={assist === "takeover" ? { duration: 0.5, repeat: Infinity, repeatDelay: 1.2 } : { duration: 0.2 }}
        >
          <motion.span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-xl transition-colors duration-500",
              assist === "off" && "bg-white/10 text-white/55",
              assist === "active" && "bg-[#2aa8ff]/20 text-[#6fd6ff]",
              assist === "nudge" && "bg-ios-orange/15 text-ios-orange",
              assist === "takeover" && "bg-ios-red text-white",
            )}
            animate={assist === "nudge" || assist === "takeover" ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, repeat: assist === "nudge" || assist === "takeover" ? Infinity : 0 }}
          >
            <WheelGlyph className="size-[18px]" />
          </motion.span>
          <div className="min-w-0 flex-1 whitespace-nowrap leading-tight">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={assist}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <div className="truncate text-[13px] font-semibold">{copy.title}</div>
                <div className="truncate text-[11px] text-white/55">{copy.sub}</div>
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.button
            type="button"
            onClick={act}
            whileTap={{ scale: 0.94 }}
            className={cn(
              "h-8 shrink-0 cursor-pointer rounded-xl px-3 text-[12px] font-semibold outline-none transition-colors duration-300",
              assist === "off" && "bg-[#2aa8ff]/15 text-[#2aa8ff] hover:bg-[#2aa8ff]/25",
              assist === "active" && "bg-white/10 text-white hover:bg-white/15",
              assist === "nudge" && "bg-ios-orange/15 text-ios-orange",
              assist === "takeover" && "bg-ios-red text-white",
            )}
          >
            {copy.action}
          </motion.button>
        </motion.div>
      </div>
    </Widget>
  );
}
