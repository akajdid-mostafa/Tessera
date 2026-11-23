import type { WidgetEntry } from "@/catalog/types";
import { AttritionWidget } from "./attrition";
import { EnpsWidget } from "./enps";
import { LeaveRequestWidget } from "./leave-request";
import { OpenRolesWidget } from "./open-roles";
import { OrgChartWidget } from "./org-chart";
import { WhosOutWidget } from "./whos-out";
import { PayrollRunWidget } from "./payroll-run";
import { OnboardingWidget } from "./onboarding";

export const entries: WidgetEntry[] = [
  {
    id: "whos-out",
    title: "Who's Out",
    size: "small",
    description: "Everyone out today as faces with a reason dot; tap to page through tomorrow and Friday as the faces pop in and the count rolls.",
    Component: WhosOutWidget,
  },
  {
    id: "open-roles",
    title: "Open Roles",
    size: "medium",
    description: "Priority requisitions with their hiring manager, candidates per stage and days open; hover a stage column to light it up and total it in the corner.",
    Component: OpenRolesWidget,
  },
  {
    id: "org-chart",
    title: "Engineering Org",
    size: "large",
    description: "The engineering org drawn as a tree of faces with open seats, a new hire and a notice period; tap a team to focus it and its stats roll in below.",
    Component: OrgChartWidget,
  },
  {
    id: "enps",
    title: "eNPS",
    size: "small",
    description: "Employee NPS on a half gauge that sweeps to the score past a goal tick; hover the split bar to read promoters, passives and detractors.",
    Component: EnpsWidget,
  },
  {
    id: "leave-request",
    title: "Leave Requests",
    size: "medium",
    description: "A pending leave request over the team's cover for the week; approving one that leaves a day short asks you to confirm before it is stamped and the next slides in.",
    Component: LeaveRequestWidget,
  },
  {
    id: "attrition",
    title: "Attrition",
    size: "medium",
    description: "Rolling 12-month attrition against its target line, with months over target traced in red; switch all or voluntary and scrub any month.",
    Component: AttritionWidget,
  },
  {
    id: "payroll-run",
    title: "Payroll Run",
    size: "small",
    description: "The next payroll run with its gross rolling in, a live countdown to today's cut-off and two flagged exceptions; press and hold to approve, and the run locks.",
    Component: PayrollRunWidget,
  },
  {
    id: "onboarding",
    title: "Onboarding",
    size: "medium",
    description: "A new hire's first week as a day track of task chips filling to today, with one blocked badge request pulsing red; hover a task to read it and nudge the team holding it up.",
    Component: OnboardingWidget,
  },
];
