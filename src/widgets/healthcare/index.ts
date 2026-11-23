import type { WidgetEntry } from "@/catalog/types";
import { ErWaitWidget } from "./er-wait";
import { HeartRateWidget } from "./heart-rate";
import { MedicationScheduleWidget } from "./medication-schedule";
import { PatientVitalsWidget } from "./patient-vitals";
import { WardBedsWidget } from "./ward-beds";
import { IvInfusionWidget } from "./iv-infusion";
import { LabResultsWidget } from "./lab-results";
import { OnCallWidget } from "./on-call";

export const entries: WidgetEntry[] = [
  {
    id: "heart-rate",
    title: "Heart Rate",
    size: "small",
    description: "Live BPM over a scrolling ECG trace, the heart icon beating at the live rate.",
    Component: HeartRateWidget,
  },
  {
    id: "ward-beds",
    title: "Ward Beds",
    size: "medium",
    description: "A ward's bed board colored by occupied, free, cleaning and reserved, changing live; tap a free bed to admit the next ED patient as it fills with a spring and the counts roll.",
    Component: WardBedsWidget,
  },
  {
    id: "er-wait",
    title: "ER Wait",
    size: "small",
    description: "Median ER wait with a trend chip and an ESI 1–5 triage strip that ticks as patients arrive; hover a level for its target.",
    Component: ErWaitWidget,
  },
  {
    id: "patient-vitals",
    title: "Patient Vitals",
    size: "large",
    description: "A bedside monitor with HR, SpO₂, ART, Resp and Temp tiles over live traces; when a value crosses its limit the tile flashes until you acknowledge it.",
    Component: PatientVitalsWidget,
  },
  {
    id: "medication-schedule",
    title: "Medication Schedule",
    size: "medium",
    description: "Today's doses as pills on a time track with a now marker; tap a due dose to log it, the check pops and the 7-day adherence rolls up.",
    Component: MedicationScheduleWidget,
  },
  {
    id: "iv-infusion",
    title: "IV Infusion",
    size: "small",
    description: "An infusion pump channel with a draining bag, drops falling in the drip chamber and the volume left ticking down; pause it and a pause timer runs until it raises a callback alarm.",
    Component: IvInfusionWidget,
  },
  {
    id: "on-call",
    title: "On Call",
    size: "medium",
    description: "Tonight's on-call team as memoji with presence rings for in house, busy and backup; tap someone to page them, the ring pulses blue until they acknowledge with a reply.",
    Component: OnCallWidget,
  },
  {
    id: "lab-results",
    title: "Lab Results",
    size: "large",
    description: "This morning's chemistry and CBC as rows with reference-range bars and H/L flags under a pulsing critical potassium; hover a row to swap its bar for the five-draw trend, and read back the critical value to clear the alarm.",
    Component: LabResultsWidget,
  },
];
