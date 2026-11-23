import type { WidgetEntry } from "@/catalog/types";
import { CheckoutLanesWidget } from "./checkout-lanes";
import { ConversionWidget } from "./conversion";
import { DepartmentSalesWidget } from "./department-sales";
import { FootfallWidget } from "./footfall";
import { ShelfCheckWidget } from "./shelf-check";
import { StoreHeatmapWidget } from "./store-heatmap";
import { TopSellersWidget } from "./top-sellers";
import { FloorCoverageWidget } from "./floor-coverage";
import { PickupLockersWidget } from "./pickup-lockers";
import { LoyaltySignupsWidget } from "./loyalty-signups";
import { GateAlarmWidget } from "./gate-alarm";

export const entries: WidgetEntry[] = [
  {
    id: "conversion",
    title: "Conversion",
    size: "small",
    description: "Store conversion over a pass-by, came-in and bought funnel that ticks live; tap to compare yesterday and last Monday as the bars and digits roll.",
    Component: ConversionWidget,
  },
  {
    id: "checkout-lanes",
    title: "Checkout Lanes",
    size: "medium",
    description: "Tills seen from above with live queues of shoppers and a longest wait over five minutes; open till 5 with a confirm and the line rebalances as the alarm clears.",
    Component: CheckoutLanesWidget,
  },
  {
    id: "store-heatmap",
    title: "Store Heatmap",
    size: "large",
    description: "The ground floor as a traffic or dwell heatmap with associates and wandering shoppers on it; hover a zone to read it, and a hot zone with no staff is flagged.",
    Component: StoreHeatmapWidget,
  },
  {
    id: "shelf-check",
    title: "Shelf Check",
    size: "small",
    description: "A skincare bay drawn against its planogram with gaps and a misplaced product; tap a facing to refill or fix it while shoppers keep emptying new ones.",
    Component: ShelfCheckWidget,
  },
  {
    id: "department-sales",
    title: "Sales vs Target",
    size: "medium",
    description: "Each department's sales against its target to now, with a target tick on every bar; switch today or month-to-date and the bars and figures roll.",
    Component: DepartmentSalesWidget,
  },
  {
    id: "footfall",
    title: "Footfall",
    size: "medium",
    description: "Hourly door counts as bars over last Monday's dashed line, with the current hour still filling live; scrub any hour to compare.",
    Component: FootfallWidget,
  },
  {
    id: "top-sellers",
    title: "Best Sellers",
    size: "large",
    description: "Today's top six products with hourly sparklines, units or sales and a change pill against last Monday, re-ranking live as they sell; tap the tote running low to send a restock request.",
    Component: TopSellersWidget,
  },
  {
    id: "floor-coverage",
    title: "Floor Coverage",
    size: "medium",
    description: "Associates rostered per hour against the floor's need with a NOW marker and an evening running short; hover an hour to read it, offer the cover shift and a teammate takes it as the bars fill.",
    Component: FloorCoverageWidget,
  },
  {
    id: "pickup-lockers",
    title: "Pickup Lockers",
    size: "medium",
    description: "The click-and-collect locker bank with ready, empty and expired doors, swinging open as customers collect; tap a door to remind its customer or pull an expired parcel back to stock.",
    Component: PickupLockersWidget,
  },
  {
    id: "loyalty-signups",
    title: "Loyalty",
    size: "small",
    description: "Loyalty sign-ups on a half gauge against the day's goal with a pace tick, ticking up live as associates sign people up; tap to page from the whole store to each associate.",
    Component: LoyaltySignupsWidget,
  },
  {
    id: "gate-alarm",
    title: "Exit Gates",
    size: "small",
    description: "The anti-theft exit gates drawn as pedestals pulsing red with a running timer while tags are detected; acknowledge, log it as real or false, and the gates re-arm until the next alarm.",
    Component: GateAlarmWidget,
  },
];
