import { ChevronDown16Filled, ChevronUp16Filled } from "@fluentui/react-icons";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";
import { DefrostGlyph, FanGlyph, SeatGlyph } from "./_parts";

const MIN_T = 16;
const MAX_T = 28;
const AUTO_FAN = 4;

/* Fan ring: ten segments over a 270° sweep, gap at the bottom. */
const R = 28;
const polar = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [33 + R * Math.cos(a), 33 + R * Math.sin(a)];
};
const SEGMENTS = Array.from({ length: 10 }, (_, i) => {
  const a0 = 135 + i * 27 + 3;
  const [x0, y0] = polar(a0);
  const [x1, y1] = polar(a0 + 21);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
});

type Seat = "driver" | "passenger";
const DEFROST = [
  { label: "Defrost", tone: "" },
  { label: "Defog", tone: "orange" },
  { label: "Max defrost", tone: "red" },
] as const;

/** In-car · medium. Cabin climate for the driver's profile: ± the set point, tap the fan ring and seats to cycle levels, defrost wipes amber to red. */
export function ClimateWidget({ index }: { index?: number }) {
  const reduce = useReducedMotion();
  const [temp, setTemp] = useState(21.5);
  const [cabin, setCabin] = useState(18.6);
  const [fan, setFan] = useState(AUTO_FAN);
  const [auto, setAuto] = useState(true);
  const [ac, setAc] = useState(true);
  const [rear, setRear] = useState(false);
  const [defrost, setDefrost] = useState(0);
  const [seats, setSeats] = useState<Record<Seat, number>>({ driver: 2, passenger: 0 });
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      setCabin((c) => {
        const gap = temp - c;
        if (Math.abs(gap) < 0.1) return temp;
        return Math.round((c + Math.sign(gap) * Math.min(Math.abs(gap), 0.2)) * 10) / 10;
      });
    }, 1600);
    return () => window.clearInterval(t);
  }, [temp]);

  const bump = (d: number) => setTemp((t) => Math.min(MAX_T, Math.max(MIN_T, t + d)));
  const cycleSeat = (k: Seat) => setSeats((s) => ({ ...s, [k]: s[k] === 0 ? 3 : s[k] - 1 }));
  const level = defrost === 2 ? 10 : fan;
  const trend = Math.abs(temp - cabin) < 0.1 ? "steady" : temp > cabin ? "heating" : "cooling";

  return (
    <Widget size="medium" index={index} label="Climate">
      <div className="flex h-7 items-center gap-2">
        <MemojiAvatar who="f3" size={28} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold text-heading">Climate</div>
          <div className="truncate text-[11px] text-tertiary">Emily's profile · {auto ? "Auto" : "Manual"}</div>
        </div>
        <span className="shrink-0 text-[11px] text-tertiary">
          Outside <span className="font-semibold text-heading tabular">7°C</span>
        </span>
      </div>

      <div className="mt-3 flex h-[72px] items-center justify-between">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <RoundBtn label="Lower temperature" onClick={() => bump(-0.5)}>
              <ChevronDown16Filled />
            </RoundBtn>
            <div className="w-[86px] text-center text-[34px] leading-none font-semibold tracking-tight text-heading">
              <AnimatedNumber value={temp} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="°" />
            </div>
            <RoundBtn label="Raise temperature" onClick={() => bump(0.5)}>
              <ChevronUp16Filled />
            </RoundBtn>
          </div>
          <div className="mt-1.5 text-[11px] whitespace-nowrap text-tertiary">
            Cabin <AnimatedNumber value={cabin} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="°" className="text-secondary" /> ·{" "}
            <span className={trend === "heating" ? "text-ios-orange" : trend === "cooling" ? "text-ios-blue" : ""}>{trend}</span>
          </div>
        </div>

        <motion.button
          type="button"
          aria-label={`Fan level ${level}, tap to raise`}
          onClick={() => {
            setAuto(false);
            setFan((f) => (f % 10) + 1);
          }}
          whileTap={{ scale: 0.92 }}
          className="relative grid size-[66px] shrink-0 cursor-pointer place-items-center rounded-full outline-none"
        >
          <svg viewBox="0 0 66 66" className="absolute inset-0 size-full" fill="none" strokeWidth="4" strokeLinecap="round" aria-hidden>
            {SEGMENTS.map((d) => (
              <path key={`b${d}`} d={d} className="stroke-fill-secondary" />
            ))}
            {SEGMENTS.map((d, i) => (
              <motion.path
                key={d}
                d={d}
                className={defrost === 2 ? "stroke-ios-red" : "stroke-[var(--ant-color-text)]"}
                initial={{ opacity: 0 }}
                animate={{ opacity: i < level ? 1 : 0 }}
                transition={{ delay: i < level ? delay + i * 0.04 : 0, duration: 0.25 }}
              />
            ))}
          </svg>
          <div className="relative flex flex-col items-center leading-none">
            <motion.span
              key={level}
              className="grid text-heading"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 3.2 / Math.sqrt(level), repeat: Infinity, ease: "linear" }}
            >
              <FanGlyph className="size-[18px]" />
            </motion.span>
            <span className="mt-0.5 text-[10px] font-semibold text-tertiary tabular">{auto ? "AUTO" : level}</span>
          </div>
        </motion.button>

        <div className="flex gap-1.5">
          {(["driver", "passenger"] as const).map((k) => (
            <SeatButton key={k} seat={k} level={seats[k]} onPress={() => cycleSeat(k)} />
          ))}
        </div>
      </div>

      <div className="mt-auto flex h-7 gap-1.5">
        <Pill
          className="flex-[1.35]"
          active={defrost > 0}
          tone={defrost === 2 ? "red" : "orange"}
          wipeKey={defrost}
          onClick={() => setDefrost((d) => (d + 1) % 3)}
        >
          <DefrostGlyph className="size-4 shrink-0" />
          {DEFROST[defrost].label}
        </Pill>
        <Pill active={rear} tone="orange" wipeKey={Number(rear)} onClick={() => setRear((r) => !r)}>
          <DefrostGlyph rear className="size-4 shrink-0" />
          Rear
        </Pill>
        <Pill active={ac} tone="blue" wipeKey={Number(ac)} onClick={() => setAc((a) => !a)}>
          A/C
        </Pill>
        <Pill
          active={auto}
          tone="blue"
          wipeKey={Number(auto)}
          onClick={() => {
            setAuto((a) => !a);
            setFan(AUTO_FAN);
          }}
        >
          Auto
        </Pill>
      </div>
    </Widget>
  );
}

function RoundBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.86 }}
      className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full bg-fill-tertiary text-[14px] text-secondary outline-none transition-colors hover:bg-fill-secondary hover:text-heading"
    >
      {children}
    </motion.button>
  );
}

function SeatButton({ seat, level, onPress }: { seat: Seat; level: number; onPress: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={`${seat === "driver" ? "Driver" : "Passenger"} seat heat ${level}, tap to change`}
      onClick={onPress}
      whileTap={{ scale: 0.92 }}
      className="flex w-[52px] cursor-pointer flex-col items-center rounded-xl py-1 outline-none transition-colors hover:bg-fill-quaternary"
    >
      <svg viewBox="0 0 24 12" className="h-3 w-6" fill="none" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        {[6, 12, 18].map((x, i) => (
          <motion.path
            key={x}
            d={`M${x} 11 q-2 -2.5 0 -5 q2 -2.5 0 -5`}
            className={i < level ? "stroke-ios-red" : "stroke-[var(--ant-color-text-quaternary)]"}
            initial={false}
            animate={{ y: i < level ? [3, 0] : 0, opacity: i < level ? [0, 1] : 1 }}
            transition={{ delay: i < level ? i * 0.12 : 0, duration: 0.3 }}
          />
        ))}
      </svg>
      <SeatGlyph className={cn("size-6 transition-colors", seat === "passenger" && "-scale-x-100", level ? "text-heading" : "text-tertiary")} />
      <span className="mt-0.5 text-[10px] text-tertiary">{seat === "driver" ? "Driver" : "Passenger"}</span>
    </motion.button>
  );
}

function Pill({
  active,
  tone,
  wipeKey,
  onClick,
  className,
  children,
}: {
  active: boolean;
  tone: "orange" | "red" | "blue";
  wipeKey: number;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  const fill = tone === "red" ? "bg-ios-red/15" : tone === "orange" ? "bg-ios-orange/15" : "bg-ios-blue/15";
  const text = tone === "red" ? "text-ios-red" : tone === "orange" ? "text-ios-orange" : "text-ios-blue";
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full bg-fill-tertiary text-[12px] font-medium whitespace-nowrap outline-none",
        active ? text : "text-secondary",
        className,
      )}
    >
      {active ? (
        <motion.span
          key={wipeKey}
          className={cn("absolute inset-0 origin-left", fill)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      <span className="relative flex items-center gap-1">{children}</span>
    </motion.button>
  );
}
