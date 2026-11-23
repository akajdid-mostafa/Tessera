import type { WidgetEntry } from "@/catalog/types";
import { AtRiskArrivalsWidget } from "./at-risk-arrivals";
import { RoomRackWidget } from "./room-rack";
import { TapeChartWidget } from "./tape-chart";
import { TurnoverSeamsWidget } from "./turnover-seams";
import { UnassignedQueueWidget } from "./unassigned-queue";
import { WaitingDeskWidget } from "./waiting-desk";

export const entries: WidgetEntry[] = [
  {
    id: "room-rack",
    title: "Room Rack",
    size: "large",
    description:
      "All 100 rooms as tiles colored by tonight's front-desk state with a housekeeping dot, live check-ins flashing in; tap the summary chips to filter and the tiles reflow, hover a tile for its guest and night.",
    Component: RoomRackWidget,
  },
  {
    id: "turnover-seams",
    title: "Turnover Seams",
    size: "medium",
    description:
      "Today's same-day turnovers from checkout to the next guest's ETA, the seam bar filling from cleaning minutes and turning red when the room won't make it; Rush gives the room priority and pulls the estimate in.",
    Component: TurnoverSeamsWidget,
  },
  {
    id: "waiting-desk",
    title: "Waiting at Desk",
    size: "small",
    description:
      "Guests waiting at the desk for a room that isn't clean, with the longest wait ticking on a ring as guests come and go; Rush sets their rooms to priority and the ring starts to beat.",
    Component: WaitingDeskWidget,
  },
  {
    id: "at-risk-arrivals",
    title: "At-Risk Arrivals",
    size: "medium",
    description:
      "Arrivals whose room won't be ready, with the reason; Move to ready room slides a clean room of the same type into place and clears the risk, and a new risk shakes in a moment later.",
    Component: AtRiskArrivalsWidget,
  },
  {
    id: "unassigned-queue",
    title: "Unassigned",
    size: "medium",
    description:
      "Reservations with no room grouped by room type; Auto assign flies each card into a room-number chip while the count rolls down, and the Villa stay that can't fit stays behind with its reason.",
    Component: UnassignedQueueWidget,
  },
  {
    id: "tape-chart",
    title: "Tape Chart",
    size: "large",
    description:
      "A week of the tape chart for eight rooms with stays colored by status, a linked split stay, a locked stay and a today column; tap a stay for details, drag it to another room to snap into a dashed fit slot or spring back on a conflict.",
    Component: TapeChartWidget,
  },
];
