import type { WidgetEntry } from "@/catalog/types";
import { ActivityRingsWidget } from "./activity-rings";
import { ClassScheduleWidget } from "./class-schedule";
import { HydrationWidget } from "./hydration";
import { LiveWorkoutWidget } from "./live-workout";
import { SleepStagesWidget } from "./sleep-stages";
import { TrainingLoadWidget } from "./training-load";
import { RecoveryWidget } from "./recovery";
import { RouteReplayWidget } from "./route-replay";
import { StepStreakWidget } from "./step-streak";
import { StrengthLogWidget } from "./strength-log";

export const entries: WidgetEntry[] = [
  {
    id: "activity-rings",
    title: "Activity Rings",
    size: "small",
    description: "Move, Exercise and Stand rings spring closed on load; tap to flip to the week, where a missed Thursday broke the streak.",
    Component: ActivityRingsWidget,
  },
  {
    id: "hydration",
    title: "Hydration",
    size: "small",
    description: "Today's water in a glass that sloshes against a 2.5 L goal; tap +250 ml to fill it and roll the digits, or undo the last glass.",
    Component: HydrationWidget,
  },
  {
    id: "sleep-stages",
    title: "Sleep Stages",
    size: "medium",
    description: "Last night's hypnogram across Awake, REM, Core and Deep wipes in from bedtime; scrub it to read the stage and clock time at any minute.",
    Component: SleepStagesWidget,
  },
  {
    id: "live-workout",
    title: "Live Workout",
    size: "large",
    description: "An outdoor run with timer, heart rate, zone marker and time-in-zone bars; start it for a 3-2-1 countdown and everything goes live until you pause or end.",
    Component: LiveWorkoutWidget,
  },
  {
    id: "training-load",
    title: "Training Load",
    size: "medium",
    description: "Fourteen days of strain as bars against the optimal 8–14 band, flagging overreaching; hover a day to read its load in the hero.",
    Component: TrainingLoadWidget,
  },
  {
    id: "class-schedule",
    title: "Class Schedule",
    size: "medium",
    description: "Today's studio classes with coach, fill bar and spots left; book one and the count rolls, or join the waitlist when it is full.",
    Component: ClassScheduleWidget,
  },
  {
    id: "recovery",
    title: "Recovery",
    size: "small",
    description: "This morning's recovery score on a half gauge that sweeps into its zone; tap HRV, resting HR or sleep to read it against the 30-day baseline.",
    Component: RecoveryWidget,
  },
  {
    id: "step-streak",
    title: "Step Streak",
    size: "medium",
    description: "Twenty weeks of daily steps as a contribution grid with a streak chip; today's cell pulses and ticks live until it clears the goal and the streak rolls up, and hovering any day reads it out.",
    Component: StepStreakWidget,
  },
  {
    id: "strength-log",
    title: "Strength Log",
    size: "medium",
    description: "The current lift as set chips beside a rest timer ring that counts down; tap the next set to log it and restart the rest, tap the last one to undo, and the session volume rolls up.",
    Component: StrengthLogWidget,
  },
  {
    id: "route-replay",
    title: "Route Replay",
    size: "large",
    description: "A half-marathon loop drawn onto a map over its elevation profile; drag along the profile to run the pin round the route and read distance, pace, elevation and heart rate at that point.",
    Component: RouteReplayWidget,
  },
];
