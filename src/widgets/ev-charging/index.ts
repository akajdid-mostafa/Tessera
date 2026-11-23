import type { WidgetEntry } from "@/catalog/types";
import { ChargingHubWidget } from "./charging-hub";
import { ConnectorStopWidget } from "./connector-stop";
import { FaultDeckWidget } from "./fault-deck";
import { HomeWallboxWidget } from "./home-wallbox";
import { HubQueueWidget } from "./hub-queue";
import { LiveSessionWidget } from "./live-session";
import { LoadBalancerWidget } from "./load-balancer";
import { NetworkTrendWidget } from "./network-trend";

export const entries: WidgetEntry[] = [
  {
    id: "live-session",
    title: "Live Session",
    size: "large",
    description:
      "A DC session's SoC ring, kW, time to limit, kWh and cost over the car's taper curve; the dot rides the curve as it slows past 80 %, drops to zero when the car stops at its limit and starts the idle-fee countdown, and you can scrub the curve or raise the limit to resume.",
    Component: LiveSessionWidget,
  },
  {
    id: "home-wallbox",
    title: "Home Charger",
    size: "medium",
    description:
      "An 11 kW home wallbox that charges now, waits for the off-peak window or follows solar surplus, pausing when the sun dips; switch modes to replan it on the 24 h tariff ribbon and drag the battery's limit handle, which snaps at 80 and 90 %.",
    Component: HomeWallboxWidget,
  },
  {
    id: "connector-stop",
    title: "Stop & Release",
    size: "small",
    description:
      "A public DC session ticking up kW and kWh around the connector; hold the plug to stop it, then tap to release the locked cable and watch it go from Finishing to Available.",
    Component: ConnectorStopWidget,
  },
  {
    id: "hub-queue",
    title: "Hub Queue",
    size: "small",
    description:
      "Drivers waiting for a full 12-stall hub; a stall flashes free and the line steps forward, and Join puts you in the queue with your place and estimated wait.",
    Component: HubQueueWidget,
  },
  {
    id: "charging-hub",
    title: "Charging Hub",
    size: "large",
    description:
      "Eight connectors as live OCPP tiles in a two-column grid (Charging with kW and SoC, Preparing, SuspendedEV, Finishing, Faulted, Unavailable, Offline) that cycle as cars come and go; tap one for its detail and reset the ground-faulted connector through a confirm step.",
    Component: ChargingHubWidget,
  },
  {
    id: "load-balancer",
    title: "Site Load Sharing",
    size: "medium",
    description:
      "Building load and every charger's share stacked against a 150 kW grid limit; cars plug in and the segments rebalance, and past the limit the line flashes red with the curtailed demand drawn as a ghost; tap a charger to plug or unplug it.",
    Component: LoadBalancerWidget,
  },
  {
    id: "fault-deck",
    title: "Open Faults",
    size: "small",
    description:
      "Open OCPP faults as a deck of cards with error and vendor codes; tap to flip through, and Reset arms for four seconds, confirms, and sends the card flying off the stack.",
    Component: FaultDeckWidget,
  },
  {
    id: "network-trend",
    title: "Network",
    size: "medium",
    description:
      "Thirty days of network uptime against a 97 % target, utilisation or revenue as bars that grow in on load; switch the metric and hover a day to read it, with the two under-target days called out.",
    Component: NetworkTrendWidget,
  },
];
