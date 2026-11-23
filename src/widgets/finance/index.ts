import type { WidgetEntry } from "@/catalog/types";
import { AccountBalanceWidget } from "./account-balance";
import { SavingsGoalWidget } from "./savings-goal";
import { SpendingWidget } from "./spending";
import { UpcomingBillsWidget } from "./upcoming-bills";
import { WatchlistWidget } from "./watchlist";
import { CreditScoreWidget } from "./credit-score";
import { FraudAlertWidget } from "./fraud-alert";
import { FxTransferWidget } from "./fx-transfer";
import { CashFlowWidget } from "./cash-flow";
import { PortfolioRebalanceWidget } from "./portfolio-rebalance";
import { SpendCalendarWidget } from "./spend-calendar";

export const entries: WidgetEntry[] = [
  {
    id: "spending",
    title: "Card Spending",
    size: "large",
    description: "Stacked spend by category for the week or month; tap a category to drop it and watch the total and budget re-flow.",
    Component: SpendingWidget,
  },
  {
    id: "watchlist",
    title: "Watchlist",
    size: "medium",
    description: "Three stocks with intraday sparklines, live prices and change pills; prices tick with rolling digits, pills flash on each move and a tap focuses a row.",
    Component: WatchlistWidget,
  },
  {
    id: "account-balance",
    title: "Account Balance",
    size: "small",
    description: "A checking balance beside a mini debit card that rolls up on entrance; tap to blur it behind privacy dots and tap again to reveal it.",
    Component: AccountBalanceWidget,
  },
  {
    id: "upcoming-bills",
    title: "Upcoming Bills",
    size: "medium",
    description: "The next four bills on a three-week timeline with due-day markers; Pay settles the nearest one, its marker turns to a check and the total rolls down.",
    Component: UpcomingBillsWidget,
  },
  {
    id: "savings-goal",
    title: "Savings Goal",
    size: "small",
    description: "A jar filling toward a $4,500 summer trip; Add drops a coin in, the level rises and the total rolls up until the goal glows.",
    Component: SavingsGoalWidget,
  },
  {
    id: "credit-score",
    title: "Credit Score",
    size: "small",
    description: "A 300–850 half gauge with coloured score bands, where a marker sweeps to 768 as the number rolls up; tap to page to the four factors that moved it.",
    Component: CreditScoreWidget,
  },
  {
    id: "fraud-alert",
    title: "Card Alert",
    size: "medium",
    description: "A held $842 overseas charge with its risk reasons and a live auto-decline clock; It was me releases it, Not me asks for a second tap before freezing the card, and Undo brings the alert back.",
    Component: FraudAlertWidget,
  },
  {
    id: "fx-transfer",
    title: "Send Money",
    size: "medium",
    description: "A USD to EUR transfer quote with fee and a 24-hour rate sparkline; the rate is held for 20 seconds on a draining ring and then refreshes, while swap flips the direction and the amounts roll.",
    Component: FxTransferWidget,
  },
  {
    id: "cash-flow",
    title: "Cash Flow",
    size: "medium",
    description: "Six months of income bars above a zero line and spending bars below it, with that month's net beside them; bars grow in on load, hovering previews a month and tapping pins it.",
    Component: CashFlowWidget,
  },
  {
    id: "portfolio-rebalance",
    title: "Portfolio Rebalance",
    size: "large",
    description: "An allocation donut with a drift-from-target list and a live account value; Rebalance previews the trades, Confirm springs every slice to target and hovering an asset isolates it.",
    Component: PortfolioRebalanceWidget,
  },
  {
    id: "spend-calendar",
    title: "Daily Spend",
    size: "small",
    description: "A five-week heatmap of daily card spend with no-spend days marked in mint, whose cells pop in on a diagonal; hover or tap a day to read its amount in the hero.",
    Component: SpendCalendarWidget,
  },
];
