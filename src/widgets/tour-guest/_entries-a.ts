import type { WidgetEntry } from "@/catalog/types";
import { DayProgramWidget } from "./day-program";
import { NextTripWidget } from "./next-trip";
import { OverdueBalancesWidget } from "./overdue-balances";
import { PaymentScheduleWidget } from "./payment-schedule";
import { SlotPickerWidget } from "./slot-picker";

export const entries: WidgetEntry[] = [
  {
    id: "payment-schedule",
    title: "Payment Schedule",
    size: "medium",
    description:
      "A booking's deposit, installments and balance on a stepper with each line's due date and state; Record payment opens a method picker, settles the next line and the paid bar fills.",
    Component: PaymentScheduleWidget,
  },
  {
    id: "overdue-balances",
    title: "Overdue Balances",
    size: "medium",
    description:
      "Bookings with an overdue deposit or balance, with lead guest, amount and days late; Send reminder rings the bell and stamps the row, and the overdue total rolls as payments land.",
    Component: OverdueBalancesWidget,
  },
  {
    id: "next-trip",
    title: "Next Trip",
    size: "small",
    description:
      "The storefront customer's next trip as split-flap day digits with its status chip and paid-of-total bar; tap to flip through upcoming trips.",
    Component: NextTripWidget,
  },
  {
    id: "day-program",
    title: "Day Program",
    size: "large",
    description:
      "A package day's route with timed stops, included badges and the night's hotel; a dot drives the road with the time of day, Day 1/2/3 switches the program and tapping a stop jumps there.",
    Component: DayProgramWidget,
  },
  {
    id: "slot-picker",
    title: "Slot Picker",
    size: "medium",
    description:
      "An activity's departure slots with live seat pips and the lead guide's rating; tapping a slot snaps the selection, nearly-full slots shimmer and a full one offers the waitlist.",
    Component: SlotPickerWidget,
  },
];
