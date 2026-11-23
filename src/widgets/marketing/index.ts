import type { WidgetEntry } from "@/catalog/types";
import { AttributionFlowWidget } from "./attribution-flow";
import { BudgetPacingWidget } from "./budget-pacing";
import { CampaignsWidget } from "./campaigns";
import { ContentCalendarWidget } from "./content-calendar";
import { FollowerGrowthWidget } from "./follower-growth";
import { PostPerformanceWidget } from "./post-performance";
import { AbTestWidget } from "./ab-test";
import { BestTimeWidget } from "./best-time";
import { EmailSendWidget } from "./email-send";
import { BrandMentionsWidget } from "./brand-mentions";

export const entries: WidgetEntry[] = [
  {
    id: "follower-growth",
    title: "Follower Growth",
    size: "small",
    description: "Followers ticking up live over a 30-day area with a dashed goal line and a forecast cone to Dec 31; tap to switch between Instagram, TikTok and LinkedIn.",
    Component: FollowerGrowthWidget,
  },
  {
    id: "campaigns",
    title: "Campaigns",
    size: "medium",
    description: "Active ad campaigns with spend, CTR, a 7-day ROAS sparkline and a ROAS pill, one of them losing money; ROAS or Spend re-sorts the rows as they slide.",
    Component: CampaignsWidget,
  },
  {
    id: "attribution-flow",
    title: "Attribution Flow",
    size: "large",
    description: "A Sankey of five channels flowing into trials and paid plans with particles running along each ribbon; hover a channel to isolate it and switch First, Linear or Last to reflow the credit.",
    Component: AttributionFlowWidget,
  },
  {
    id: "budget-pacing",
    title: "Budget Pacing",
    size: "small",
    description: "A campaign burning past its daily budget, spend rolling up live in red against pace and budget ticks; Pause asks to confirm on a timer, then the spend freezes.",
    Component: BudgetPacingWidget,
  },
  {
    id: "post-performance",
    title: "Top Posts",
    size: "large",
    description: "The week's top social post with its photo, reach, engagement and four counters that keep climbing; tap to page through the top three.",
    Component: PostPerformanceWidget,
  },
  {
    id: "content-calendar",
    title: "Content Calendar",
    size: "large",
    description: "A week of posts across five networks on a time grid with a live now line and one failed post; tap any block for its detail and retry the failure until it publishes.",
    Component: ContentCalendarWidget,
  },
  {
    id: "ab-test",
    title: "A/B Test",
    size: "medium",
    description: "A live checkout-button test with each variant's conversion rate inside a 95% interval that tightens as visitors arrive; Ship B unlocks once the chance to win passes 95% and asks to confirm.",
    Component: AbTestWidget,
  },
  {
    id: "best-time",
    title: "Best Time to Post",
    size: "large",
    description: "A week-by-hour heatmap of how posts perform by when they go out, with the best slot starred and the current hour pulsing; hover any cell to read it and switch between reach and clicks.",
    Component: BestTimeWidget,
  },
  {
    id: "email-send",
    title: "Newsletter Send",
    size: "small",
    description: "A newsletter going out to 18,900 people as a waffle of the list that fills live from queued to delivered to opened; tap to swap opens for clicks.",
    Component: EmailSendWidget,
  },
  {
    id: "brand-mentions",
    title: "Brand Mentions",
    size: "medium",
    description: "Mentions per hour as diverging positive and negative bars around a morning complaint spike, with new mentions landing live in a feed; hover an hour to read its split.",
    Component: BrandMentionsWidget,
  },
];
