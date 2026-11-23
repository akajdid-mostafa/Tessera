import type { WidgetEntry } from "@/catalog/types";
import { CommitHeatmapWidget } from "./commit-heatmap";
import { DeployPipelineWidget } from "./deploy-pipeline";
import { ErrorRateWidget } from "./error-rate";
import { PullRequestsWidget } from "./pull-requests";
import { UptimeWidget } from "./uptime";
import { MrrMovementWidget } from "./mrr-movement";
import { OnCallWidget } from "./on-call";
import { FeatureFlagWidget } from "./feature-flag";
import { CloudSpendWidget } from "./cloud-spend";
import { EndpointLatencyWidget } from "./endpoint-latency";

export const entries: WidgetEntry[] = [
  {
    id: "uptime",
    title: "Service Uptime",
    size: "medium",
    description: "Uptime and live latency with a 45-day status strip; hover any day for its detail, a beam circles the healthy service.",
    Component: UptimeWidget,
  },
  {
    id: "deploy-pipeline",
    title: "Deploy Pipeline",
    size: "medium",
    description: "Build, test, security scan and deploy with live progress running through each stage; the first run fails its scan and Retry runs it again.",
    Component: DeployPipelineWidget,
  },
  {
    id: "error-rate",
    title: "Error Rate",
    size: "small",
    description: "A live error-rate sparkline that turns red above the SLO and asks “Incident?” when it spikes; hover the line to read any point.",
    Component: ErrorRateWidget,
  },
  {
    id: "pull-requests",
    title: "Pull Requests",
    size: "medium",
    description: "Reviews requested from you as PR rows with check status; Approve collapses a row away, the next slides up and the count rolls.",
    Component: PullRequestsWidget,
  },
  {
    id: "commit-heatmap",
    title: "Contributions",
    size: "large",
    description: "A 20-week contribution heatmap with total and streaks; the cells cascade in and hovering a day shows its commits split by repo.",
    Component: CommitHeatmapWidget,
  },
  {
    id: "mrr-movement",
    title: "MRR Movement",
    size: "large",
    description: "A month's MRR as a waterfall from opening through new, expansion, contraction and churn to closing; the bars grow in and re-flow when you switch months, and hovering a movement lists the accounts behind it.",
    Component: MrrMovementWidget,
  },
  {
    id: "on-call",
    title: "On-call Rotation",
    size: "medium",
    description: "Who holds the pager now, with the week's rotation as a strip, past pages and a creeping Now marker; Page asks to confirm, then pulses the engineer's ring until they acknowledge.",
    Component: OnCallWidget,
  },
  {
    id: "feature-flag",
    title: "Feature Flag",
    size: "small",
    description: "A flag's rollout as a ring of users with a stage picker and a big kill switch; picking a stage springs the ring wider, and the power button drains it to zero.",
    Component: FeatureFlagWidget,
  },
  {
    id: "cloud-spend",
    title: "Cloud Spend",
    size: "medium",
    description: "Month-to-date cloud spend stacked by service against the budget line, with a forecast that runs past it; costs accrue live and hovering a service shows its share and change on last month.",
    Component: CloudSpendWidget,
  },
  {
    id: "endpoint-latency",
    title: "API Endpoints",
    size: "medium",
    description: "API endpoints as stock-style rows with a live latency sparkline, value and change pill; a p50/p95/p99 switch rolls every number, and hovering a row reads its traffic and errors.",
    Component: EndpointLatencyWidget,
  },
];
