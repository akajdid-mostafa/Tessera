import { Globe20Filled } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MemojiAvatar } from "@/lib/memoji";
import { AnimatedNumber } from "@/motion/animated-number";
import { Widget, WidgetHeader } from "@/motion/widget";
import { cn } from "@/registry/antuikit/lib/utils";

/* ---------- The dot map: 48 × 20 dots, 80°N to 60°S, equirectangular. ---------- */

const COLS = 48;
const ROWS = 20;
const STEP = 8;
const MAP_W = COLS * STEP;
const MAP_H = ROWS * STEP;

/** Land as longitude ranges per 7° band of latitude, coarse on purpose. */
const LAND: [number, number][][] = [
  [[-115, -75], [-70, -20], [15, 25], [55, 60], [95, 110]],
  [[-165, -140], [-135, -80], [-75, -65], [-55, -22], [15, 30], [30, 180]],
  [[-165, -142], [-140, -95], [-78, -64], [-50, -42], [-22, -14], [5, 178]],
  [[-130, -95], [-79, -58], [-6, -1], [8, 162]],
  [[-125, -53], [-5, 135], [142, 144]],
  [[-124, -70], [-9, 3], [9, 28], [27, 130], [139, 142]],
  [[-120, -77], [-8, 11], [33, 121], [126, 129], [130, 140]],
  [[-112, -97], [-82, -80], [-14, 34], [35, 121]],
  [[-105, -87], [-84, -75], [-17, 38], [40, 58], [70, 87], [93, 110]],
  [[-91, -84], [-17, 52], [74, 80], [98, 109], [120, 125]],
  [[-77, -55], [-11, 47], [80, 81], [100, 103], [122, 126]],
  [[-80, -50], [9, 42], [100, 118], [120, 123], [131, 135]],
  [[-79, -35], [12, 40], [106, 115], [138, 148]],
  [[-76, -39], [12, 40], [44, 50], [125, 145]],
  [[-70, -41], [14, 35], [43, 48], [114, 150]],
  [[-71, -49], [16, 32], [114, 153]],
  [[-72, -57], [19, 22], [116, 118], [136, 150], [173, 175]],
  [[-74, -63], [145, 148], [170, 174]],
  [[-75, -68]],
  [],
];

const DOTS = LAND.flatMap((ranges, r) =>
  Array.from({ length: COLS }, (_, c) => {
    const lon = -180 + 7.5 * (c + 0.5);
    const land = ranges.some(([a, b]) => lon >= a - 2 && lon <= b + 2);
    return land ? { x: c * STEP + STEP / 2, y: r * STEP + STEP / 2, k: r * COLS + c } : null;
  }).filter((d): d is { x: number; y: number; k: number } => d !== null),
);

const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * MAP_W,
  y: ((80 - lat) / 140) * MAP_H,
});

/* ---------- Orders ---------- */

type City = { city: string; lat: number; lon: number; buyers: string[] };
const CITIES: City[] = [
  { city: "New York", lat: 40.7, lon: -74, buyers: ["Ella J.", "Marcus O."] },
  { city: "Toronto", lat: 43.7, lon: -79.4, buyers: ["Lucas G.", "Priya S."] },
  { city: "Los Angeles", lat: 34, lon: -118.2, buyers: ["Kai A.", "Rosa M."] },
  { city: "Mexico City", lat: 19.4, lon: -99.1, buyers: ["Diego F."] },
  { city: "São Paulo", lat: -23.5, lon: -46.6, buyers: ["Ana S.", "Bruno L."] },
  { city: "London", lat: 51.5, lon: -0.1, buyers: ["Tom H.", "Amara E."] },
  { city: "Paris", lat: 48.9, lon: 2.3, buyers: ["Chloé B."] },
  { city: "Madrid", lat: 40.4, lon: -3.7, buyers: ["Sofía R."] },
  { city: "Berlin", lat: 52.5, lon: 13.4, buyers: ["Lena M.", "Jonas W."] },
  { city: "Chicago", lat: 41.9, lon: -87.6, buyers: ["Emma D."] },
  { city: "Dubai", lat: 25.2, lon: 55.3, buyers: ["Omar K."] },
  { city: "Mumbai", lat: 19, lon: 72.8, buyers: ["Ravi P."] },
  { city: "Singapore", lat: 1.3, lon: 103.8, buyers: ["Wei C."] },
  { city: "Seoul", lat: 37.5, lon: 127, buyers: ["Jae-won L."] },
  { city: "Tokyo", lat: 35.7, lon: 139.7, buyers: ["Kenji T.", "Yui N."] },
  { city: "Sydney", lat: -33.9, lon: 151.2, buyers: ["Mia W."] },
  { city: "Cape Town", lat: -33.9, lon: 18.4, buyers: ["Thandi N."] },
];
const PRODUCTS = [
  { name: "Pour-Over Coffee Kit", price: 64 },
  { name: "Arc Desk Lamp", price: 129 },
  { name: "Trailhead Pack 24L", price: 119 },
  { name: "Low-Profile Keyboard", price: 159 },
  { name: "Blue-Light Glasses", price: 79 },
  { name: "Aura ANC Headphones", price: 249 },
];

type Order = { id: number; c: number; buyer: string; product: string; qty: number; amount: number; at: number };

function makeOrder(id: number, at: number, pick: () => number): Order {
  const c = Math.floor(pick() * CITIES.length);
  const p = PRODUCTS[Math.floor(pick() * PRODUCTS.length)];
  const qty = pick() < 0.78 ? 1 : 2;
  const buyers = CITIES[c].buyers;
  return { id, c, buyer: buyers[Math.floor(pick() * buyers.length)], product: p.name, qty, amount: p.price * qty, at };
}

/** A fixed opening feed, so the first frame is the same on every load. */
function seedOrders(now: number): Order[] {
  let s = 7;
  const pick = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return [9, 41, 75, 128, 190, 260].map((ago, i) => makeOrder(-i - 1, now - ago * 1000, pick));
}

const ORDER_EVERY_MS = 3200;
const PINS = 7;
const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const;

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

/** E-commerce · large. A dot world map where each new order drops a pin with a ripple, over a live feed; hover a row to find its pin. */
export function LiveOrdersMapWidget({ index }: { index?: number }) {
  const [orders, setOrders] = useState<Order[]>(() => seedOrders(Date.now()));
  const [count, setCount] = useState(214);
  const [revenue, setRevenue] = useState(18_920);
  const [now, setNow] = useState(() => Date.now());
  const [hovered, setHovered] = useState<number | null>(null);
  const counter = useRef(0);
  const delay = 0.3 + (index ?? 0) * 0.06;

  useEffect(() => {
    const t = window.setInterval(() => {
      counter.current += 1;
      const order = makeOrder(counter.current, Date.now(), Math.random);
      setOrders((o) => [order, ...o].slice(0, PINS));
      setCount((n) => n + 1);
      setRevenue((r) => r + order.amount);
    }, ORDER_EVERY_MS);
    const c = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(c);
    };
  }, []);

  const feed = orders.slice(0, 2);
  const newest = orders[0]?.id;
  const focus = hovered ?? null;

  return (
    <Widget size="large" index={index} label="Live orders map">
      <WidgetHeader
        icon={<Globe20Filled />}
        tint="var(--ios-blue)"
        title="Live Orders"
        subtitle="Kinfolk Supply · 34 countries"
        extra={
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-ios-green/15 px-2 py-0.5 text-[11px] font-semibold text-ios-green">
            <motion.span
              className="size-1.5 rounded-full bg-ios-green"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            Live
          </span>
        }
      />

      {/* Labels share one line, numbers share one baseline. */}
      <div className="mt-2 grid grid-cols-[auto_auto_1fr] items-baseline gap-x-5 whitespace-nowrap">
        <div className="text-[11px] text-tertiary">Orders · last hour</div>
        <div className="text-[11px] text-tertiary">Revenue</div>
        <div className="text-right text-[11px] text-tertiary">Avg order</div>
        <AnimatedNumber
          value={count}
          className="text-[30px] leading-none font-semibold tracking-tight text-heading"
        />
        <AnimatedNumber value={revenue} format={USD} className="text-[17px] leading-none font-semibold text-heading" />
        <AnimatedNumber
          value={revenue / count}
          format={USD}
          className="justify-self-end text-[17px] leading-none font-semibold text-secondary"
        />
      </div>

      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="mt-2 block w-full overflow-visible" aria-hidden>
        {DOTS.map((d) => (
          <motion.circle
            key={d.k}
            cx={d.x}
            cy={d.y}
            r={1.7}
            fill="var(--ant-color-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + (d.x / MAP_W) * 0.6, duration: 0.4 }}
          />
        ))}
        <AnimatePresence>
          {orders.map((o, i) => {
            const { x, y } = project(CITIES[o.c].lat, CITIES[o.c].lon);
            const on = focus === o.id;
            const fresh = o.id === newest && o.id > 0;
            return (
              <motion.g
                key={o.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: focus === null || on ? 1 - i * 0.09 : 0.25, scale: 1 }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                transition={{ type: "spring", stiffness: 420, damping: 18, delay: o.id < 0 ? delay + 0.5 + i * 0.08 : 0 }}
              >
                {fresh ? (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="var(--ios-blue)"
                    initial={{ scale: 1, opacity: 0.55 }}
                    animate={{ scale: 4.5, opacity: 0 }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                  />
                ) : null}
                <motion.circle
                  cx={x}
                  cy={y}
                  fill="var(--ios-blue)"
                  stroke="var(--widget-surface)"
                  strokeWidth={1.5}
                  r={on ? 6 : 4}
                  initial={false}
                  animate={{ r: on ? 6 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                />
              </motion.g>
            );
          })}
        </AnimatePresence>
        <AnimatePresence>
          {focus !== null
            ? (() => {
                const o = orders.find((x) => x.id === focus);
                if (!o) return null;
                const { x, y } = project(CITIES[o.c].lat, CITIES[o.c].lon);
                const below = y < 22;
                return (
                  <motion.g
                    key={focus}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <text
                      x={Math.min(MAP_W - 40, Math.max(40, x))}
                      y={below ? y + 20 : y - 11}
                      textAnchor="middle"
                      className="fill-[var(--ant-color-text-heading)] text-[11px] font-semibold"
                      stroke="var(--widget-surface)"
                      strokeWidth={3}
                      paintOrder="stroke"
                    >
                      {CITIES[o.c].city}
                    </text>
                  </motion.g>
                );
              })()
            : null}
        </AnimatePresence>
      </svg>

      <ul className="mt-auto flex flex-col gap-1.5" onMouseLeave={() => setHovered(null)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {feed.map((o, i) => (
            <motion.li
              key={o.id}
              layout
              initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onMouseEnter={() => setHovered(o.id)}
              onFocus={() => setHovered(o.id)}
              tabIndex={0}
              className={cn(
                "relative -mx-1.5 flex h-[42px] cursor-default items-center gap-2.5 rounded-lg px-1.5 outline-none transition-colors",
                hovered === o.id && "bg-fill-quaternary",
                i > 0 && "before:absolute before:inset-x-1.5 before:-top-[3.5px] before:h-[0.5px] before:bg-split",
              )}
            >
              <MemojiAvatar who={o.buyer} size={28} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-heading">
                  {o.buyer} <span className="font-normal text-tertiary">· {CITIES[o.c].city}</span>
                </div>
                <div className="truncate text-[11px] text-tertiary">
                  {o.qty > 1 ? `${o.qty} × ` : ""}
                  {o.product}
                </div>
              </div>
              <div className="shrink-0 text-right leading-tight">
                <div className="text-[12px] font-semibold text-heading tabular">${o.amount}</div>
                <div className={cn("text-[10px] tabular", now - o.at < 5000 ? "font-semibold text-ios-green" : "text-tertiary")}>
                  {ago(now - o.at)}
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Widget>
  );
}
