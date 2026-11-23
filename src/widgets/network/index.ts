import type { WidgetEntry } from "@/catalog/types";
import { OpticalRxWidget } from "./optical-rx";
import { SwitchPortsWidget } from "./switch-ports";
import { TopInterfacesWidget } from "./top-interfaces";
import { WanUplinksWidget } from "./wan-uplinks";
import { WifiApWidget } from "./wifi-ap";
import { DhcpPoolWidget } from "./dhcp-pool";
import { SiteLatencyWidget } from "./site-latency";

export const entries: WidgetEntry[] = [
  {
    id: "switch-ports",
    title: "Switch Port Panel",
    size: "large",
    description:
      "A 24-port access switch faceplate whose activity LEDs blink at each port's traffic; tap a port for live mirrored throughput, or re-enable the err-disabled one with a guarded command.",
    Component: SwitchPortsWidget,
  },
  {
    id: "wifi-ap",
    title: "Access Point",
    size: "small",
    description:
      "An access point radiating rings at a pace set by its client count; tap to step through its 5, 2.4 and 6 GHz radios as utilisation fills and turns amber past 60%.",
    Component: WifiApWidget,
  },
  {
    id: "optical-rx",
    title: "Optical Rx Power",
    size: "small",
    description:
      "SFP receive power over 24 hours against its warning and loss-of-signal thresholds; the trace draws in, ticks live, and dragging across it reads any hour.",
    Component: OpticalRxWidget,
  },
  {
    id: "wan-uplinks",
    title: "WAN Uplinks",
    size: "medium",
    description:
      "Fiber and LTE uplinks with packets riding the active link; when the fiber starts dropping packets the on-call engineer is paged and a two-step failover slides the Active badge to LTE.",
    Component: WanUplinksWidget,
  },
  {
    id: "top-interfaces",
    title: "Top Interfaces",
    size: "medium",
    description:
      "The busiest core-switch interfaces with sparklines, rates and utilisation pills, re-ranked live as rows slide to their new places; switch between inbound and outbound.",
    Component: TopInterfacesWidget,
  },
  {
    id: "site-latency",
    title: "Site Latency",
    size: "medium",
    description:
      "Twenty-four hours of round-trip time from five sites to HQ as a heatmap; cells sweep in, the current hour flashes on each live update, SLA breaches burn amber and red, and hovering reads any site and hour.",
    Component: SiteLatencyWidget,
  },
  {
    id: "dhcp-pool",
    title: "DHCP Scope",
    size: "small",
    description:
      "A /24 DHCP scope drawn as 256 address cells; new leases pop in green and old ones expire live, the count turns amber past 90% full, and hovering a cell reads its address and host.",
    Component: DhcpPoolWidget,
  },
];
