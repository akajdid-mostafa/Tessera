import type { WidgetEntry } from "@/catalog/types";
import { BookingFunnelWidget } from "./booking-funnel";
import { OptionsExpiringWidget } from "./options-expiring";
import { ProfitMarginWidget } from "./profit-margin";
import { RequestInboxWidget } from "./request-inbox";
import { ReservationsTodayWidget } from "./reservations-today";
import { RevenueMonthWidget } from "./revenue-month";

export const entries: WidgetEntry[] = [
  {
    id: "reservations-today",
    title: "Today's Reservations",
    size: "small",
    description:
      "Today's reservations against yesterday with a polarity-aware change chip and a 7-day sparkline that draws in; new bookings tick in live and hovering a day reads its count.",
    Component: ReservationsTodayWidget,
  },
  {
    id: "options-expiring",
    title: "Options Expiring",
    size: "medium",
    description:
      "Option bookings sorted by optionExpiresAt, each lead's memoji ringed by the hours left; Confirm slides the row out as the count rolls, +24h refills the ring, and a lapsed option sits in red to release.",
    Component: OptionsExpiringWidget,
  },
  {
    id: "request-inbox",
    title: "Request Inbox",
    size: "medium",
    description:
      "Booking requests with their channel and supplier decision; Send link flies a paper plane to the supplier, flips the row to pending and the answer lands live.",
    Component: RequestInboxWidget,
  },
  {
    id: "booking-funnel",
    title: "Booking Lifecycle",
    size: "large",
    description:
      "Request → option → confirmed → completed as rising columns joined by flow ribbons with drop-offs and cancellation reasons; 7/30/90-day ranges re-flow and hovering a stage reads its conversion.",
    Component: BookingFunnelWidget,
  },
  {
    id: "revenue-month",
    title: "Revenue This Month",
    size: "medium",
    description:
      "Month-to-date revenue in dollars against last month over a 30-day area; scrub the crosshair to read any day's bookings and revenue while new bookings land live.",
    Component: RevenueMonthWidget,
  },
  {
    id: "profit-margin",
    title: "Profit Margin",
    size: "small",
    description:
      "This month's profit and margin on a half gauge that fills on entry; the lock simulates a user without readCost, blurring the figures as \"Hidden\" until tapped to peek.",
    Component: ProfitMarginWidget,
  },
];
