import type { WidgetEntry } from "@/catalog/types";
import { BuildingUnitsWidget } from "./building-units";
import { ListingViewsWidget } from "./listing-views";
import { OpenHouseWidget } from "./open-house";
import { PropertyValueWidget } from "./property-value";
import { RentCollectionWidget } from "./rent-collection";
import { LeakAlertWidget } from "./leak-alert";
import { MortgageCalcWidget } from "./mortgage-calc";
import { FloorPlanWidget } from "./floor-plan";

export const entries: WidgetEntry[] = [
  {
    id: "property-value",
    title: "Property Value",
    size: "medium",
    description: "Estimated value with a scrubbable area chart; scrub to read any month, switch 1Y/3Y/5Y to replay the draw.",
    Component: PropertyValueWidget,
  },
  {
    id: "listing-views",
    title: "Listing Views",
    size: "small",
    description: "Today's views for a listing over a 7-day sparkline; new views tick in live and tap switches between views and saves.",
    Component: ListingViewsWidget,
  },
  {
    id: "open-house",
    title: "Open House",
    size: "small",
    description: "A live countdown to the next open house with its RSVPs; tap to page through upcoming showings as the faces pop in.",
    Component: OpenHouseWidget,
  },
  {
    id: "rent-collection",
    title: "Rent Collection",
    size: "medium",
    description: "Rent collected against what is due this month with tenant rows; ring a late tenant's bell and it shakes into a sent check.",
    Component: RentCollectionWidget,
  },
  {
    id: "building-units",
    title: "Building Units",
    size: "large",
    description: "A building's units stacked floor by floor by lease status; switch buildings to rebuild the stack and hover a unit for its tenant and lease end.",
    Component: BuildingUnitsWidget,
  },
  {
    id: "leak-alert",
    title: "Leak Alert",
    size: "small",
    description: "A tenant-reported kitchen leak in alarm red with a running unassigned timer and a pulsing glow; Dispatch plumber swaps it for a technician whose ETA counts down as a car icon drives the track to on-site.",
    Component: LeakAlertWidget,
  },
  {
    id: "mortgage-calc",
    title: "Mortgage",
    size: "medium",
    description: "Monthly payment for a listing split into principal, interest, tax and insurance; drag the down-payment slider or switch 15Y and 30Y and the hero rolls, the split bar reflows and PMI appears below 20%.",
    Component: MortgageCalcWidget,
  },
  {
    id: "floor-plan",
    title: "Floor Plan",
    size: "large",
    description: "A drawn two-bedroom floor plan with doors and windows whose outer wall traces in and rooms fade up; hover or tap a room to roll its area and note into the hero, and switch between m² and ft².",
    Component: FloorPlanWidget,
  },
];
