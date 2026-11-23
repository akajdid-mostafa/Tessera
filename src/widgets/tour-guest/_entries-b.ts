import type { WidgetEntry } from "@/catalog/types";
import { RefundMeterWidget } from "./refund-meter";
import { RoomingWidget } from "./rooming";
import { VisaFilesWidget } from "./visa-files";
import { WaitingChatsWidget } from "./waiting-chats";

export const entries: WidgetEntry[] = [
  {
    id: "refund-meter",
    title: "Refund Meter",
    size: "small",
    description:
      "The cancellation policy's refund tiers on a strip to departure with today's marker; the marker sweeps in and the refund rolls down tier by tier, the next drop counts down live, and a tap swaps Standard for Flexible.",
    Component: RefundMeterWidget,
  },
  {
    id: "visa-files",
    title: "Visa Files",
    size: "medium",
    description:
      "Visa files flowing through new, documents, review, appointment, submitted, decision and passport returned, each column's strip colored by who holds the ball and each chip toned by its apply-by day; tap a chip to move it one allowed step and it slides to the next column.",
    Component: VisaFilesWidget,
  },
  {
    id: "rooming",
    title: "Rooming Lists",
    size: "medium",
    description:
      "Rooming lists per hotel with state, confirmed lines as ticks, a changed badge and the due day; sending a new version sweeps the bar and moves the list to sent, then the hotel's confirmations tick in one by one.",
    Component: RoomingWidget,
  },
  {
    id: "waiting-chats",
    title: "Waiting Chats",
    size: "small",
    description:
      "Unassigned inbox conversations with their WhatsApp, Instagram, chat and e-mail channels and the longest wait ticking live; past five minutes the card pulses orange, and Take it assigns the oldest to you as the count rolls down.",
    Component: WaitingChatsWidget,
  },
];
