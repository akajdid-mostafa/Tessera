import type { WidgetEntry } from "@/catalog/types";
import { AdrRevparWidget } from "./adr-revpar";
import { ArrivalsTodayWidget } from "./arrivals-today";
import { ChannelMixWidget } from "./channel-mix";
import { CompSetWidget } from "./comp-set";
import { GuestReviewsWidget } from "./guest-reviews";
import { HousekeepingWidget } from "./housekeeping";
import { OccupancyWidget } from "./occupancy";

export const entries: WidgetEntry[] = [
  {
    id: "occupancy",
    title: "Occupancy",
    size: "small",
    description: "Rooms sold tonight as a ring; tap to page through tomorrow and the weekend, the ring and digits follow.",
    Component: OccupancyWidget,
  },
  {
    id: "arrivals-today",
    title: "Arrivals Today",
    size: "medium",
    description: "Today's arrivals with room, ETA and VIP flags; check a guest in and the button turns to a check, the row leaves and the counter rolls.",
    Component: ArrivalsTodayWidget,
  },
  {
    id: "housekeeping",
    title: "Housekeeping",
    size: "large",
    description: "The room board by floor with a ready-to-sell ring; tap a room to move it from dirty to clean to inspected, and status chips spotlight one state.",
    Component: HousekeepingWidget,
  },
  {
    id: "adr-revpar",
    title: "ADR & RevPAR",
    size: "small",
    description: "Seven days of rate against last week as paired bars; tap to swap ADR, RevPAR and occupancy as the digits and bars roll.",
    Component: AdrRevparWidget,
  },
  {
    id: "channel-mix",
    title: "Channel Mix",
    size: "medium",
    description: "Booking share by channel as one segmented bar; hover a channel to enlarge its segment and read its revenue and commission.",
    Component: ChannelMixWidget,
  },
  {
    id: "comp-set",
    title: "Comp Set",
    size: "small",
    description: "Our rate as a dot on a price strip among five nearby hotels with its rank and gap to the median; tap to page tonight, Friday and Saturday and the dots slide to their new prices.",
    Component: CompSetWidget,
  },
  {
    id: "guest-reviews",
    title: "Guest Reviews",
    size: "large",
    description: "The 90-day guest score as a half gauge beside category bars and the latest reviews; hover a category to swing the gauge to its score, reply to a review with a tick, and new reviews slide in live.",
    Component: GuestReviewsWidget,
  },
];
