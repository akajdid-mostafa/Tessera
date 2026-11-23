import type { WidgetEntry } from "@/catalog/types";
import { CameraWallWidget } from "./camera-wall";
import { DoorBoardWidget } from "./door-board";
import { IntrusionPanelWidget } from "./intrusion-panel";
import { PerimeterWidget } from "./perimeter";
import { RecordingIntegrityWidget } from "./recording-integrity";
import { GuardTourWidget } from "./guard-tour";
import { LprGateWidget } from "./lpr-gate";
import { MusterWidget } from "./muster";

export const entries: WidgetEntry[] = [
  {
    id: "perimeter",
    title: "Perimeter Zones",
    size: "small",
    description:
      "Eight fence zones ring the site footprint; a detection sweeps along its segment, flashes it amber and rolls the count, and hovering a segment reads that zone.",
    Component: PerimeterWidget,
  },
  {
    id: "recording-integrity",
    title: "Recording Integrity",
    size: "small",
    description:
      "Seven days of recording integrity against a shaded 95% floor; bars rise in a stagger, the RAID-rebuild day glows amber, and hovering a bar explains its gaps.",
    Component: RecordingIntegrityWidget,
  },
  {
    id: "intrusion-panel",
    title: "Intrusion Panel",
    size: "medium",
    description:
      "An intrusion area keypad with Stay/Away; hold to arm starts an exit-delay countdown that lights the 24-zone ring until the area arms, and holding again disarms.",
    Component: IntrusionPanelWidget,
  },
  {
    id: "door-board",
    title: "Door Status",
    size: "medium",
    description:
      "A door board with Locked, Unlocked, Held and Forced states; the forced door pulses until you tap and confirm a reset, the held timer counts up toward red, and badge reads land live with memoji cardholders.",
    Component: DoorBoardWidget,
  },
  {
    id: "camera-wall",
    title: "Camera Wall",
    size: "large",
    description:
      "Six cameras drawn as abstract scenes with REC dots and ticking timestamps; a car crosses a scanning analytics box, alarm tiles pulse, the offline camera crawls with static, and tapping a tile expands it.",
    Component: CameraWallWidget,
  },
  {
    id: "guard-tour",
    title: "Guard Tour",
    size: "medium",
    description:
      "A night patrol drawn as its route around the building; the walked path draws in, the guard's memoji steps to each checkpoint live, a missed checkpoint pings red, hovering reads a checkpoint and Call rings the guard.",
    Component: GuardTourWidget,
  },
  {
    id: "muster",
    title: "Evacuation Muster",
    size: "large",
    description:
      "A fire-drill roll call: people scan in at three assembly points as the ring and counts roll up, the unaccounted list shrinks live, and a warden confirms the last stragglers safe to reach all clear.",
    Component: MusterWidget,
  },
  {
    id: "lpr-gate",
    title: "Plate Reader Gate",
    size: "small",
    description:
      "A car-park gate's plate reader: each plate types in character by character, the barrier lifts for allowlisted cars, a hotlist hit glows red, and tapping the card opens the barrier manually.",
    Component: LprGateWidget,
  },
];
