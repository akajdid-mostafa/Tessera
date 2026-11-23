import type { WidgetEntry } from "@/catalog/types";
import { MachineFleetWidget } from "./machine-fleet";
import { OeeRingWidget } from "./oee-ring";
import { StackLightWidget } from "./stack-light";
import { VibrationWidget } from "./vibration";
import { WorkOrderWidget } from "./work-order";
import { ChangeoverWidget } from "./changeover";
import { PlcRackWidget } from "./plc-rack";
import { BarrelZonesWidget } from "./barrel-zones";
import { DowntimeParetoWidget } from "./downtime-pareto";
import { LineFlowWidget } from "./line-flow";

export const entries: WidgetEntry[] = [
  {
    id: "oee-ring",
    title: "OEE Rings",
    size: "small",
    description:
      "Availability, performance and quality as three rings that multiply to the line's OEE; they sweep in one after another, and tapping pages through lines while any factor below its target turns amber.",
    Component: OeeRingWidget,
  },
  {
    id: "stack-light",
    title: "Stack Light",
    size: "small",
    description:
      "A press's stack light and downtime clock, its red lens flashing at 1 Hz until you acknowledge it, which pages a technician and then clears the tower to green.",
    Component: StackLightWidget,
  },
  {
    id: "vibration",
    title: "Vibration Health",
    size: "medium",
    description:
      "A pump bearing's velocity RMS over seven days on ISO 20816 zone bands, with a zone pointer that settles with a damped wobble and a trend you can scrub to read any sample.",
    Component: VibrationWidget,
  },
  {
    id: "work-order",
    title: "Work Order",
    size: "medium",
    description:
      "A work order's part count rolling up live against a moving plan marker, where Hold asks for a second tap within four seconds and a held order runs its own timer.",
    Component: WorkOrderWidget,
  },
  {
    id: "machine-fleet",
    title: "Machine Fleet",
    size: "large",
    description:
      "Six CNC machines ranked by severity with live spindle-load sparklines and part counts; the down machine flashes until tapped, and a Parts/Load switch rolls the value column.",
    Component: MachineFleetWidget,
  },
  {
    id: "changeover",
    title: "Changeover",
    size: "small",
    description:
      "A mold change timed against its 25:00 standard on a seven-step track that fills live and turns amber the moment the step and the change run late; Done checks off each step.",
    Component: ChangeoverWidget,
  },
  {
    id: "plc-rack",
    title: "PLC Rack",
    size: "small",
    description:
      "A PLC rack drawn slot by slot with channel LEDs flickering to the I/O and a CPU heartbeat; the analog card with a broken 4–20 mA loop flashes priority 2 until tapped, and hovering any card names it.",
    Component: PlcRackWidget,
  },
  {
    id: "barrel-zones",
    title: "Barrel Heat Zones",
    size: "medium",
    description:
      "An injection barrel's six heat zones as PV-vs-setpoint bullets over a drawn barrel whose screw turns during recovery, with a failing heater band outlined low; hover a zone for its output and tap it to acknowledge.",
    Component: BarrelZonesWidget,
  },
  {
    id: "downtime-pareto",
    title: "Downtime Pareto",
    size: "medium",
    description:
      "A shift's unplanned downtime as a Pareto with a cumulative line and 80% cut, bars growing in rank order; tap the hatched uncoded bar to give it a reason and the bars re-rank.",
    Component: DowntimeParetoWidget,
  },
  {
    id: "line-flow",
    title: "Line Flow",
    size: "large",
    description:
      "A bottling line drawn as a U with bottles moved by a live queue simulation, packing up on the buffer ahead of a slow labeler; tap any machine for its detail and reset the labeler with a two-tap confirm to watch the buffer drain.",
    Component: LineFlowWidget,
  },
];
