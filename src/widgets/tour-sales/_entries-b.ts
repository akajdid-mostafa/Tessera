import type { WidgetEntry } from "@/catalog/types";
import { B2bBalanceWidget } from "./b2b-balance";
import { BestSellerWidget } from "./best-seller";
import { ChannelMixWidget } from "./channel-mix";
import { DiscountApprovalWidget } from "./discount-approval";
import { OffersPulseWidget } from "./offers-pulse";

export const entries: WidgetEntry[] = [
  {
    id: "discount-approval",
    title: "Discount Approval",
    size: "medium",
    description:
      "A discount request over the sales limit (KY-26-0405, 30% → 35%) rolls its total and margin to the asked rate and turns a loss red; Approve or Reject flips the card, the queue count rolls down and the next request slides in.",
    Component: DiscountApprovalWidget,
  },
  {
    id: "channel-mix",
    title: "Revenue by Channel",
    size: "medium",
    description:
      "Revenue by booking channel as a donut that sweeps in; tap a slice or a legend row to pop it out with its dollars and bookings, and switch 30 or 90 days to watch the slices re-share.",
    Component: ChannelMixWidget,
  },
  {
    id: "best-seller",
    title: "Best Seller",
    size: "medium",
    description:
      "The month's best-selling tour on a desert photo cover with a crown that bounces in; tap to page through the busiest day ahead and the cancellation rate, each figure rolling up.",
    Component: BestSellerWidget,
  },
  {
    id: "offers-pulse",
    title: "Offer Activity",
    size: "medium",
    description:
      "Today's offer links with their view counts; when a customer opens one the eye blinks and the row flashes, an acceptance adds to the unpaid total, and Nudge resends a sent offer's link.",
    Component: OffersPulseWidget,
  },
  {
    id: "b2b-balance",
    title: "B2B Balance",
    size: "small",
    description:
      "The agencies' net balance rolls as ledger postings land and turns red below zero, over a receivable/payable bar with the top agency's commission; tap to swap to the payout requests.",
    Component: B2bBalanceWidget,
  },
];
