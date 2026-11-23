import type { WidgetEntry } from "@/catalog/types";
import { ChannelSyncWidget } from "./channel-sync";
import { FreeNightsWidget } from "./free-nights";
import { ParityFlagsWidget } from "./parity-flags";
import { PriceLadderWidget } from "./price-ladder";
import { RateLevelCalendarWidget } from "./rate-level-calendar";

export const entries: WidgetEntry[] = [
  {
    id: "free-nights",
    title: "Free Nights",
    size: "small",
    description:
      "Free Standard Double room nights over the next week valued at the best rate, counting up as bars rise; tap to jump to the night with the most free rooms.",
    Component: FreeNightsWidget,
  },
  {
    id: "rate-level-calendar",
    title: "Rate Level Calendar",
    size: "large",
    description:
      "October painted by rate level with the master price on each day; pick a level and brush across days to repaint them, then review the draft and send it.",
    Component: RateLevelCalendarWidget,
  },
  {
    id: "price-ladder",
    title: "Price Ladder",
    size: "medium",
    description:
      "The master Best Available Rate with its derived Bed and Breakfast and Non-refundable plans; drag or step the master and the derived prices cascade, warning past ±20%.",
    Component: PriceLadderWidget,
  },
  {
    id: "channel-sync",
    title: "Channel Sync",
    size: "medium",
    description:
      "Every channel's sync state, error and live last-synced time, with pending channels breathing; retry a failed channel and it goes pending, then synced.",
    Component: ChannelSyncWidget,
  },
  {
    id: "parity-flags",
    title: "Parity Flags",
    size: "small",
    description:
      "Channels whose rates differ from the master calendar carry an orange corner fold; tap one to compare prices and push the master to bring it back in step.",
    Component: ParityFlagsWidget,
  },
];
