import type { WidgetEntry } from "@/catalog/types";
import { ConflictAlarmWidget } from "./conflict-alarm";
import { EndOfDayWidget } from "./end-of-day";
import { KanbanCheckinWidget } from "./kanban-checkin";
import { OpenBalancesWidget } from "./open-balances";
import { OptionHoldsWidget } from "./option-holds";
import { TodaysMovementWidget } from "./todays-movement";

export const entries: WidgetEntry[] = [
  {
    id: "todays-movement",
    title: "Today's Movement",
    size: "medium",
    description:
      "Arriving, departing and in-house guests as one three-part bar whose segments morph and counts roll as guests check in and out live; tap a segment to see its next three guests.",
    Component: TodaysMovementWidget,
  },
  {
    id: "conflict-alarm",
    title: "Conflict Alarm",
    size: "small",
    description:
      "Stays that overlap in one room or sit in an out-of-order room, red while any are open; tap one for move, shorten or override and the pick resolves it with a check as the count rolls down.",
    Component: ConflictAlarmWidget,
  },
  {
    id: "option-holds",
    title: "Option Holds",
    size: "small",
    description:
      "Tentative stays ordered by when their option lapses, with hours left counting down live; Confirm turns one into a reservation with a check and Release fades it out.",
    Component: OptionHoldsWidget,
  },
  {
    id: "kanban-checkin",
    title: "Check-in Board",
    size: "medium",
    description:
      "Arriving and In house lanes of guest cards; drag or tap a card across, confirm in the sheet and it springs into In house, with a balance due asking for payment first.",
    Component: KanbanCheckinWidget,
  },
  {
    id: "end-of-day",
    title: "End of Day",
    size: "large",
    description:
      "The end-of-day checklist with expandable rows to tick off; Handover sweeps every section to a check and types a note for the next shift.",
    Component: EndOfDayWidget,
  },
  {
    id: "open-balances",
    title: "Open Balances",
    size: "medium",
    description:
      "In-house and departing stays that owe money, largest first with red strips sized to the amount; a payment link flips to waiting then paid while the total rolls down and new charges post live.",
    Component: OpenBalancesWidget,
  },
];
