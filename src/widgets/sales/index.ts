import type { WidgetEntry } from "@/catalog/types";
import { ClosingDealsWidget } from "./closing-deals";
import { DealBoardWidget } from "./deal-board";
import { ForecastWidget } from "./forecast";
import { LogCallWidget } from "./log-call";
import { QuotaAttainmentWidget } from "./quota-attainment";
import { RepLeaderboardWidget } from "./rep-leaderboard";
import { WinRateWidget } from "./win-rate";
import { PipelineFunnelWidget } from "./pipeline-funnel";
import { TerritoryMapWidget } from "./territory-map";

export const entries: WidgetEntry[] = [
  {
    id: "quota-attainment",
    title: "Quota Attainment",
    size: "small",
    description: "Closed-won against quota as a ring with a tick for where pace says you should be; the ring springs full on load and a tap pages quarter, month and year.",
    Component: QuotaAttainmentWidget,
  },
  {
    id: "closing-deals",
    title: "Closing This Month",
    size: "medium",
    description: "Deals due to close in November with owner, stage, close date and amount; a few seconds in one deal slips to December and its date turns red, and Date or Value re-sorts the rows as they slide.",
    Component: ClosingDealsWidget,
  },
  {
    id: "forecast",
    title: "Forecast vs Commit",
    size: "medium",
    description: "Closed-won so far draws in, then a commit-to-best-case band unrolls toward a dashed quota line; scrub any week to read its closed or forecast value.",
    Component: ForecastWidget,
  },
  {
    id: "log-call",
    title: "Log a Call",
    size: "medium",
    description: "A call block with the current lead and three outcome tiles; tapping one checks it off, rolls the daily count along a stacked goal bar and slides in the next lead.",
    Component: LogCallWidget,
  },
  {
    id: "rep-leaderboard",
    title: "Rep Leaderboard",
    size: "medium",
    description: "The month's top three reps on a podium that rises on load with the rest listed beside it; switching Revenue or Deals re-ranks and each face flies to its new spot.",
    Component: RepLeaderboardWidget,
  },
  {
    id: "deal-board",
    title: "Deal Board",
    size: "large",
    description: "A three-column pipeline board with a stalled deal flagged orange; select a card to advance it, it slides into the next column and Mark won rolls the quarter's total with a green pulse.",
    Component: DealBoardWidget,
  },
  {
    id: "win-rate",
    title: "Win Rate",
    size: "small",
    description: "The last 40 closed deals as a won-or-lost dot grid with the rate and its change against Q3; picking All, SMB or Ent recolours the dots in a diagonal wave.",
    Component: WinRateWidget,
  },
  {
    id: "pipeline-funnel",
    title: "Pipeline Funnel",
    size: "medium",
    description: "Leads to won as five bars joined by conversion chips, with the step furthest below team benchmark flagged orange; Q3 or Q4 morphs the bars and hovering a chip shows its benchmark.",
    Component: PipelineFunnelWidget,
  },
  {
    id: "territory-map",
    title: "Territory Map",
    size: "large",
    description: "A hex map of twelve sales regions coloured by quota attainment with the selected rep's detail below; deals close live with a green ripple and a tap on any region brings up its rep.",
    Component: TerritoryMapWidget,
  },
];
