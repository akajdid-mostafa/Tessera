import type { WidgetEntry } from "@/catalog/types";
import { ColdChainWidget } from "./cold-chain";
import { DispatchedTodayWidget } from "./dispatched-today";
import { DockScheduleWidget } from "./dock-schedule";
import { PicksPerHourWidget } from "./picks-per-hour";
import { ShipmentWidget } from "./shipment";
import { FleetMapWidget } from "./fleet-map";
import { CarrierScorecardWidget } from "./carrier-scorecard";
import { TrailerLoadWidget } from "./trailer-load";
import { PickHeatmapWidget } from "./pick-heatmap";

export const entries: WidgetEntry[] = [
  {
    id: "shipment",
    title: "Shipment",
    size: "medium",
    description: "A delivery track whose stops light up as the truck rides its leading edge, with the courier one tap away.",
    Component: ShipmentWidget,
  },
  {
    id: "picks-per-hour",
    title: "Picks per Hour",
    size: "medium",
    description: "Warehouse picks per hour against a dashed target while the live hour's bar grows; hover a bar to read that hour.",
    Component: PicksPerHourWidget,
  },
  {
    id: "dispatched-today",
    title: "Dispatched Today",
    size: "small",
    description: "Today's dispatch count climbing live along a dotted progress bar; tap to flip between dispatched and left to dispatch.",
    Component: DispatchedTodayWidget,
  },
  {
    id: "dock-schedule",
    title: "Dock Schedule",
    size: "large",
    description: "Six dock doors on a day Gantt with a creeping NOW line and a pulsing late truck; hover any slot for carrier, plate and pallets.",
    Component: DockScheduleWidget,
  },
  {
    id: "cold-chain",
    title: "Cold Chain",
    size: "small",
    description: "A reefer's live temperature drawn over its 2–8 °C band that turns orange and shakes on an excursion; scrub the line to read past readings.",
    Component: ColdChainWidget,
  },
  {
    id: "fleet-map",
    title: "Last-Mile Fleet",
    size: "large",
    description:
      "Four delivery vans driving their routes on a street map, stops ticking off behind them and the late van pulsing orange; tap a van or its chip for the driver, stops done and time back at depot.",
    Component: FleetMapWidget,
  },
  {
    id: "carrier-scorecard",
    title: "Carrier OTIF",
    size: "medium",
    description:
      "Carriers ranked by on-time-in-full with a sparkline against the 95% target and the change on last period; switch 7D/30D and the rows re-rank and morph, hover one for its on-time and in-full split.",
    Component: CarrierScorecardWidget,
  },
  {
    id: "trailer-load",
    title: "Trailer Load",
    size: "medium",
    description:
      "A trailer seen from above filling pallet by pallet from the nose, weight climbing toward 24 t; hover a pallet for its SKU and weight, and seal the full trailer through a confirm step before the next one backs on.",
    Component: TrailerLoadWidget,
  },
  {
    id: "pick-heatmap",
    title: "Pick Heat",
    size: "small",
    description:
      "Pick locations by aisle and shelf level as a heatmap that warms with every pick, each hit rippling out; hover a cell for its location code, picks and ABC class.",
    Component: PickHeatmapWidget,
  },
];
