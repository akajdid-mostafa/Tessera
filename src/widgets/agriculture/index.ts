import type { WidgetEntry } from "@/catalog/types";
import { CenterPivotWidget } from "./center-pivot";
import { GrainBinsWidget } from "./grain-bins";
import { GreenhouseWidget } from "./greenhouse";
import { SoilMoistureWidget } from "./soil-moisture";
import { ZoneStartWidget } from "./zone-start";
import { SprayWindowWidget } from "./spray-window";
import { HerdAlertsWidget } from "./herd-alerts";
import { YieldMapWidget } from "./yield-map";

export const entries: WidgetEntry[] = [
  {
    id: "zone-start",
    title: "Irrigation Zone",
    size: "small",
    description:
      "A drip zone's run time with its depth and volume; Start asks for a timed confirm, then the valve opens, drops fall and the countdown rolls down.",
    Component: ZoneStartWidget,
  },
  {
    id: "greenhouse",
    title: "Greenhouse Climate",
    size: "small",
    description:
      "Live VPD, air temperature, humidity and CO₂ on a half gauge with each target band; tap to page and the knob springs to the new reading.",
    Component: GreenhouseWidget,
  },
  {
    id: "soil-moisture",
    title: "Soil Moisture",
    size: "medium",
    description:
      "A week of volumetric water content at 10, 30 or 60 cm between the refill and full lines; the trace draws in, the latest reading ripples and you can scrub any hour.",
    Component: SoilMoistureWidget,
  },
  {
    id: "grain-bins",
    title: "Grain Storage",
    size: "medium",
    description:
      "Bins with grain level, moisture and a 7-day temperature trace; Bin 3's hot spot pulses and keeps climbing until Aerate spins up the fans and cools it.",
    Component: GrainBinsWidget,
  },
  {
    id: "center-pivot",
    title: "Center Pivot",
    size: "large",
    description:
      "A top-down pivot field where the arm sweeps live and leaves a wet trail that dries behind it; flip forward or reverse, change the speed timer and toggle the end gun.",
    Component: CenterPivotWidget,
  },
  {
    id: "spray-window",
    title: "Spray Window",
    size: "small",
    description:
      "The next 12 hours of spray conditions as wind bars coloured good, marginal or poor by wind and Delta T; the current hour breathes and its wind ticks live, and hovering or tapping an hour previews its window.",
    Component: SprayWindowWidget,
  },
  {
    id: "herd-alerts",
    title: "Herd Alerts",
    size: "medium",
    description:
      "Collar alerts for cows in heat or off feed with a 48 h activity or rumination sparkline; a new heat slides in live, and marking a cow bred or sorted clears its row down to an empty state.",
    Component: HerdAlertsWidget,
  },
  {
    id: "yield-map",
    title: "Yield Map",
    size: "large",
    description:
      "A yield-monitor map of a corn field that the combine fills cell by cell in serpentine passes, a wet swale showing up low; switch between yield and grain moisture, and hover a harvested cell to read it.",
    Component: YieldMapWidget,
  },
];
