import type { WidgetEntry } from "@/catalog/types";
import { ConversionFunnelWidget } from "./conversion-funnel";
import { FlashSaleWidget } from "./flash-sale";
import { LiveSalesWidget } from "./live-sales";
import { LowStockWidget } from "./low-stock";
import { TopProductsWidget } from "./top-products";
import { OrderHeatmapWidget } from "./order-heatmap";
import { PaymentApprovalsWidget } from "./payment-approvals";
import { ShipCutoffWidget } from "./ship-cutoff";
import { ReturnReasonsWidget } from "./return-reasons";
import { LiveOrdersMapWidget } from "./live-orders-map";
import { CustomerReviewsWidget } from "./customer-reviews";

export const entries: WidgetEntry[] = [
  {
    id: "live-sales",
    title: "Live Sales",
    size: "small",
    description: "Today's revenue that ticks up with every order: digits roll, a +$ chip drops in, the current hour's bar grows and a soft glow breathes.",
    Component: LiveSalesWidget,
  },
  {
    id: "conversion-funnel",
    title: "Conversion Funnel",
    size: "medium",
    description: "Visitors to paid orders as five funnel bars with drop-off per step; the bars fill in sequence and hovering a step rolls its count into the hero.",
    Component: ConversionFunnelWidget,
  },
  {
    id: "low-stock",
    title: "Low Stock",
    size: "small",
    description: "One SKU close to selling out, with units left, days of cover and a draining red bar; Reorder springs into an Ordered confirmation with incoming stock.",
    Component: LowStockWidget,
  },
  {
    id: "top-products",
    title: "Top Products",
    size: "large",
    description: "This week's five best-sellers with units, revenue and a sparkline each; switching Today, Week or Month re-ranks the rows as they slide into place.",
    Component: TopProductsWidget,
  },
  {
    id: "flash-sale",
    title: "Flash Sale",
    size: "small",
    description: "A live hh:mm:ss countdown on a warm gradient with a claimed bar that keeps filling; the glow wakes in the last hour and a tap sets a reminder.",
    Component: FlashSaleWidget,
  },
  {
    id: "order-heatmap",
    title: "Order Heatmap",
    size: "medium",
    description: "Four weeks of orders as a weekday by two-hour heatmap with the Thursday evening peak called out; cells pop in diagonally and hovering one rolls its count and multiple of the average into the hero.",
    Component: OrderHeatmapWidget,
  },
  {
    id: "payment-approvals",
    title: "Payment Approvals",
    size: "small",
    description: "Approval rate on a half gauge with a 95% target tick and authorisations that tick up live; tap to page Cards, Wallets and Pay later, which turns the arc orange below target.",
    Component: PaymentApprovalsWidget,
  },
  {
    id: "ship-cutoff",
    title: "Ship Today",
    size: "medium",
    description: "Today's carrier pickups on an 08:00 to 20:00 band with a moving NOW marker and orders left to pack, flagging the courier as at risk; tap a pickup to slide the packing window and see its finish time.",
    Component: ShipCutoffWidget,
  },
  {
    id: "return-reasons",
    title: "Return Reasons",
    size: "small",
    description: "The 30-day return rate in a ring split by reason; segments draw in one by one and a tap steps to the next reason as its slice thickens and its share rolls in.",
    Component: ReturnReasonsWidget,
  },
  {
    id: "live-orders-map",
    title: "Live Orders Map",
    size: "large",
    description: "A dot world map where every new order drops a rippling pin above a live feed of buyers and baskets; hovering a feed row lifts its pin and names the city.",
    Component: LiveOrdersMapWidget,
  },
  {
    id: "customer-reviews",
    title: "Customer Reviews",
    size: "large",
    description: "Average rating with a star histogram and one review card at a time; tap a bar to filter by stars, tap the card to page, and Reply clears a low rating from the waiting count.",
    Component: CustomerReviewsWidget,
  },
];
