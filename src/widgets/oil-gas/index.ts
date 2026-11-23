import type { WidgetEntry } from "@/catalog/types";
import { EsdValveWidget } from "./esd-valve";
import { HydraulicProfileWidget } from "./hydraulic-profile";
import { TankGaugeWidget } from "./tank-gauge";
import { WellPadWidget } from "./well-pad";
import { CompressorMapWidget } from "./compressor-map";

export const entries: WidgetEntry[] = [
  {
    id: "tank-gauge",
    title: "Tank Gauge",
    size: "small",
    description:
      "A floating-roof tank on a receipt, with level, volume and time to high-high read against API 2350 ticks; the product and roof rise live, and tapping switches between US and SI units.",
    Component: TankGaugeWidget,
  },
  {
    id: "esd-valve",
    title: "Block Valve",
    size: "small",
    description:
      "A mainline block valve under select-before-operate: arm it, confirm within five seconds, then watch the bowtie fill and the flow in the pipe slow and stop as it travels.",
    Component: EsdValveWidget,
  },
  {
    id: "well-pad",
    title: "Well Pad",
    size: "medium",
    description:
      "Four wells as dense rows with state marks, live sparklines and rolling rates; switch oil and gas, hover a well for its lift detail, and tap the pumped-off well to stop its flash.",
    Component: WellPadWidget,
  },
  {
    id: "hydraulic-profile",
    title: "Hydraulic Profile",
    size: "large",
    description:
      "A crude line's pressure profile over terrain against MAOP and its 95% alarm band, breathing with each scan while a flashing high alarm at Stanton waits to be acknowledged; tap any station for its readings.",
    Component: HydraulicProfileWidget,
  },
  {
    id: "compressor-map",
    title: "Compressor Map",
    size: "medium",
    description:
      "A gas compressor's head-flow map with speed lines and surge limit and control lines, its operating point trailing live as demand swings and the anti-surge valve opens to hold margin; hover the map to read flow and head, tap the near-surge alarm to acknowledge.",
    Component: CompressorMapWidget,
  },
];
