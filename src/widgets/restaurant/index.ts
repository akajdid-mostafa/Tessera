import type { WidgetEntry } from "@/catalog/types";
import { EightySixWidget } from "./eighty-six";
import { FloorMapWidget } from "./floor-map";
import { PrepTimersWidget } from "./prep-timers";
import { StationLoadWidget } from "./station-load";
import { TicketRailWidget } from "./ticket-rail";
import { TicketTimesWidget } from "./ticket-times";
import { CoverPacingWidget } from "./cover-pacing";
import { WaitlistWidget } from "./waitlist";
import { CourierHandoffWidget } from "./courier-handoff";
import { WalkInWidget } from "./walk-in";

export const entries: WidgetEntry[] = [
  {
    id: "prep-timers",
    title: "Prep Timers",
    size: "small",
    description: "Three prep timers count down in rings and a finished batch flashes red; tap it to start the next batch, or tap a running one to pause.",
    Component: PrepTimersWidget,
  },
  {
    id: "eighty-six",
    title: "86 Board",
    size: "small",
    description: "Items running low with portions left draining live; tap to page through them, 86 one through a timed confirm and it is stamped out, or put it back.",
    Component: EightySixWidget,
  },
  {
    id: "floor-map",
    title: "Floor Map",
    size: "medium",
    description: "The dining room as a floor plan with filled seats, turn bars and a pulsing over-turn booth; hover a table to read its covers, course, server and time.",
    Component: FloorMapWidget,
  },
  {
    id: "ticket-rail",
    title: "Ticket Rail",
    size: "large",
    description: "The expo rail of open tickets with live timers turning amber at 8 minutes and red past 12; tap items off and bump a ticket to slide the next one in.",
    Component: TicketRailWidget,
  },
  {
    id: "station-load",
    title: "Station Load",
    size: "medium",
    description: "Each line station with its lead cook, a 30-minute sparkline and a status pill, the grill backed up; ticks live and toggles between open tickets and average time.",
    Component: StationLoadWidget,
  },
  {
    id: "ticket-times",
    title: "Ticket Times",
    size: "medium",
    description: "Average ticket time per half hour against a 12-minute goal with the dinner rush running over; switch lunch and dinner, and scrub to read a slot.",
    Component: TicketTimesWidget,
  },
  {
    id: "cover-pacing",
    title: "Cover Pacing",
    size: "large",
    description: "Tonight's covers per 15-minute slot against the kitchen's pacing cap with a NOW marker, online bookings and walk-ins landing live; pick a slot to see its biggest parties and hold it from online booking.",
    Component: CoverPacingWidget,
  },
  {
    id: "waitlist",
    title: "Waitlist",
    size: "medium",
    description: "The host stand's waitlist as a row of parties whose rings fill from quote toward their wait, the first already over; pick a party, text that their table is ready and they are seated as the next walk-in joins.",
    Component: WaitlistWidget,
  },
  {
    id: "courier-handoff",
    title: "Courier Handoff",
    size: "medium",
    description: "Delivery orders at the pass, each a track with its courier riding in and the bag cooking or sealed, one courier waiting on food and another bag going cold; hand off once both meet and the next order slides in.",
    Component: CourierHandoffWidget,
  },
  {
    id: "walk-in",
    title: "Walk-in",
    size: "small",
    description: "The walk-in cooler's temperature trace climbing toward its 5 °C limit while the door is propped open; mark it closed and the box pulls back down until the next delivery props it again.",
    Component: WalkInWidget,
  },
];
