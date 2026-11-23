import type { WidgetEntry } from "@/catalog/types";
import { BaggageBeltWidget } from "./baggage-belt";
import { BoardingPassWidget } from "./boarding-pass";
import { CityClockWidget } from "./city-clock";
import { CurrencyWidget } from "./currency";
import { DeparturesBoardWidget } from "./departures-board";
import { FlightWidget } from "./flight";
import { ItineraryWidget } from "./itinerary";
import { SeatMapWidget } from "./seat-map";
import { TripCountdownWidget } from "./trip-countdown";

export const entries: WidgetEntry[] = [
  {
    id: "flight",
    title: "Flight Status",
    size: "medium",
    description: "The plane flies its arc to where the flight is now, trailing a solid line, with gate and seat below.",
    Component: FlightWidget,
  },
  {
    id: "boarding-pass",
    title: "Boarding Pass",
    size: "medium",
    description: "A notched boarding pass with a live boarding countdown; tap to flip it in 3D to a large scannable barcode.",
    Component: BoardingPassWidget,
  },
  {
    id: "trip-countdown",
    title: "Trip Countdown",
    size: "small",
    description: "Days to the next trip on its destination's colors with rolling digits and a gliding plane; tap to page through trips.",
    Component: TripCountdownWidget,
  },
  {
    id: "city-clock",
    title: "City Clock",
    size: "small",
    description: "An Apple-style analog world clock with a sweeping second hand; tap to spin the hands to the next city's time.",
    Component: CityClockWidget,
  },
  {
    id: "itinerary",
    title: "Itinerary",
    size: "large",
    description: "A day's plans on a vertical timeline with a live NOW marker; tap a plan to open its details with a layout animation.",
    Component: ItineraryWidget,
  },
  {
    id: "currency",
    title: "Exchange",
    size: "small",
    description: "Euro to yen with a thirty-day line that draws itself and a rate that ticks live; tap to swap the direction and the amount rolls into the other currency.",
    Component: CurrencyWidget,
  },
  {
    id: "departures-board",
    title: "Departures Board",
    size: "medium",
    description: "A split-flap departures board whose letters flip as flights board, get a final call and leave while the next one joins at the bottom; tap a flight to follow it and its gate and status pin to the header.",
    Component: DeparturesBoardWidget,
  },
  {
    id: "baggage-belt",
    title: "Baggage Claim",
    size: "medium",
    description: "The baggage carousel drawn with bags riding the turning belt as the flight's bags come out and a step tracker advances; your teal case glows onto the belt with an alert you can switch off, and Got it ticks the claim off.",
    Component: BaggageBeltWidget,
  },
  {
    id: "seat-map",
    title: "Seat Map",
    size: "large",
    description: "The economy cabin's seat map with sold, free, front-row and extra-legroom seats and your memoji in 22E; hover a seat to preview it, pick one and confirm a paid move in two taps, and your memoji glides over while other seats are taken and released live.",
    Component: SeatMapWidget,
  },
];
