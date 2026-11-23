import type { FluentIcon } from "@fluentui/react-icons";
import {
  Airplane20Regular,
  Bed20Regular,
  BuildingFactory20Regular,
  BuildingHome20Regular,
  BuildingMultiple20Regular,
  CameraDome20Regular,
  Cart20Regular,
  City20Regular,
  Cloud20Regular,
  Drop20Regular,
  Flash20Regular,
  GasPump20Regular,
  HeartPulse20Regular,
  LeafTwo20Regular,
  Router20Regular,
  Server20Regular,
  VehicleCar20Regular,
  VehicleTruckProfile20Regular,
  Wallet20Regular,
  WeatherPartlyCloudyDay20Regular,
  CompassNorthwest20Regular,
  KeyMultiple20Regular,
  CalendarDataBar20Regular,
  Broom20Regular,
  TicketDiagonal20Regular,
  Luggage20Regular,
  AirplaneTakeOff20Regular,
  ArrowBidirectionalUpDown20Regular,
  Beaker20Regular,
  BuildingRetail20Regular,
  Diamond20Regular,
  Fire20Regular,
  Food20Regular,
  Handshake20Regular,
  Home20Regular,
  Megaphone20Regular,
  PeopleTeam20Regular,
  PlugConnected20Regular,
  Run20Regular,
  TopSpeed20Regular,
  VehicleShip20Regular,
  VehicleSubway20Regular,
} from "@fluentui/react-icons";
import { entries as agriculture } from "@/widgets/agriculture";
import { entries as building } from "@/widgets/building";
import { entries as carRental } from "@/widgets/car-rental";
import { entries as dataCenter } from "@/widgets/data-center";
import { entries as ecommerce } from "@/widgets/ecommerce";
import { entries as energy } from "@/widgets/energy";
import { entries as factory } from "@/widgets/factory";
import { entries as finance } from "@/widgets/finance";
import { entries as healthcare } from "@/widgets/healthcare";
import { entries as hospitality } from "@/widgets/hospitality";
import { entries as logistics } from "@/widgets/logistics";
import { entries as network } from "@/widgets/network";
import { entries as oilGas } from "@/widgets/oil-gas";
import { entries as realEstate } from "@/widgets/real-estate";
import { entries as saas } from "@/widgets/saas";
import { entries as security } from "@/widgets/security";
import { entries as smartCity } from "@/widgets/smart-city";
import { entries as travel } from "@/widgets/travel";
import { entries as water } from "@/widgets/water";
import { entries as weather } from "@/widgets/weather";
import { entries as airport } from "@/widgets/airport";
import { entries as elevators } from "@/widgets/elevators";
import { entries as evCharging } from "@/widgets/ev-charging";
import { entries as fireSafety } from "@/widgets/fire-safety";
import { entries as fitness } from "@/widgets/fitness";
import { entries as hr } from "@/widgets/hr";
import { entries as inCar } from "@/widgets/in-car";
import { entries as lab } from "@/widgets/lab";
import { entries as maritime } from "@/widgets/maritime";
import { entries as marketing } from "@/widgets/marketing";
import { entries as mining } from "@/widgets/mining";
import { entries as rail } from "@/widgets/rail";
import { entries as restaurant } from "@/widgets/restaurant";
import { entries as retail } from "@/widgets/retail";
import { entries as sales } from "@/widgets/sales";
import { entries as smartHome } from "@/widgets/smart-home";
import { entries as hotelDesk } from "@/widgets/hotel-desk";
import { entries as hotelRevenue } from "@/widgets/hotel-revenue";
import { entries as hotelHouse } from "@/widgets/hotel-house";
import { entries as tourOps } from "@/widgets/tour-ops";
import { entries as tourSales } from "@/widgets/tour-sales";
import { entries as tourGuest } from "@/widgets/tour-guest";
import type { WidgetEntry } from "./types";

export type { WidgetEntry } from "./types";

export interface Category {
  slug: string;
  name: string;
  group: string;
  icon: FluentIcon;
  entries: WidgetEntry[];
}

/** Sidebar order. Groups render as small headings above their shelves. */
export const categories: Category[] = [
  { slug: "real-estate", name: "Real Estate", group: "Business", icon: BuildingHome20Regular, entries: realEstate },
  { slug: "ecommerce", name: "E-commerce", group: "Business", icon: Cart20Regular, entries: ecommerce },
  { slug: "finance", name: "Finance", group: "Business", icon: Wallet20Regular, entries: finance },
  { slug: "sales", name: "Sales & CRM", group: "Business", icon: Handshake20Regular, entries: sales },
  { slug: "marketing", name: "Marketing", group: "Business", icon: Megaphone20Regular, entries: marketing },
  { slug: "hr", name: "HR & People", group: "Business", icon: PeopleTeam20Regular, entries: hr },
  { slug: "retail", name: "Retail Store", group: "Business", icon: BuildingRetail20Regular, entries: retail },
  { slug: "restaurant", name: "Restaurant", group: "Business", icon: Food20Regular, entries: restaurant },
  { slug: "hospitality", name: "Hotel Overview", group: "Hospitality", icon: Bed20Regular, entries: hospitality },
  { slug: "hotel-desk", name: "Front Desk & Rack", group: "Hospitality", icon: KeyMultiple20Regular, entries: hotelDesk },
  { slug: "hotel-revenue", name: "Revenue & Inventory", group: "Hospitality", icon: CalendarDataBar20Regular, entries: hotelRevenue },
  { slug: "hotel-house", name: "Housekeeping & Guests", group: "Hospitality", icon: Broom20Regular, entries: hotelHouse },
  { slug: "tour-ops", name: "Tour Operations", group: "Tour Operator", icon: CompassNorthwest20Regular, entries: tourOps },
  { slug: "tour-sales", name: "Tour Bookings", group: "Tour Operator", icon: TicketDiagonal20Regular, entries: tourSales },
  { slug: "tour-guest", name: "Guests & Finance", group: "Tour Operator", icon: Luggage20Regular, entries: tourGuest },
  { slug: "car-rental", name: "Car Rental", group: "Mobility", icon: VehicleCar20Regular, entries: carRental },
  { slug: "logistics", name: "Logistics", group: "Mobility", icon: VehicleTruckProfile20Regular, entries: logistics },
  { slug: "travel", name: "Travel & Aviation", group: "Mobility", icon: Airplane20Regular, entries: travel },
  { slug: "smart-city", name: "Smart City", group: "Mobility", icon: City20Regular, entries: smartCity },
  { slug: "ev-charging", name: "EV Charging", group: "Mobility", icon: PlugConnected20Regular, entries: evCharging },
  { slug: "in-car", name: "In-Car Display", group: "Mobility", icon: TopSpeed20Regular, entries: inCar },
  { slug: "maritime", name: "Maritime & Ports", group: "Mobility", icon: VehicleShip20Regular, entries: maritime },
  { slug: "rail", name: "Rail", group: "Mobility", icon: VehicleSubway20Regular, entries: rail },
  { slug: "airport", name: "Airport Ops", group: "Mobility", icon: AirplaneTakeOff20Regular, entries: airport },
  { slug: "factory", name: "Factory", group: "Industry", icon: BuildingFactory20Regular, entries: factory },
  { slug: "energy", name: "Energy & Grid", group: "Industry", icon: Flash20Regular, entries: energy },
  { slug: "water", name: "Water & Dams", group: "Industry", icon: Drop20Regular, entries: water },
  { slug: "oil-gas", name: "Oil & Gas", group: "Industry", icon: GasPump20Regular, entries: oilGas },
  { slug: "agriculture", name: "Agriculture", group: "Industry", icon: LeafTwo20Regular, entries: agriculture },
  { slug: "mining", name: "Mining", group: "Industry", icon: Diamond20Regular, entries: mining },
  { slug: "lab", name: "Lab & Cleanroom", group: "Industry", icon: Beaker20Regular, entries: lab },
  { slug: "building", name: "Building", group: "Facilities & IT", icon: BuildingMultiple20Regular, entries: building },
  { slug: "security", name: "Security & CCTV", group: "Facilities & IT", icon: CameraDome20Regular, entries: security },
  { slug: "data-center", name: "Data Center", group: "Facilities & IT", icon: Server20Regular, entries: dataCenter },
  { slug: "network", name: "Network", group: "Facilities & IT", icon: Router20Regular, entries: network },
  { slug: "fire-safety", name: "Fire & Life Safety", group: "Facilities & IT", icon: Fire20Regular, entries: fireSafety },
  { slug: "elevators", name: "Elevators", group: "Facilities & IT", icon: ArrowBidirectionalUpDown20Regular, entries: elevators },
  { slug: "saas", name: "SaaS & DevOps", group: "Facilities & IT", icon: Cloud20Regular, entries: saas },
  { slug: "healthcare", name: "Healthcare", group: "Life", icon: HeartPulse20Regular, entries: healthcare },
  { slug: "weather", name: "Weather", group: "Life", icon: WeatherPartlyCloudyDay20Regular, entries: weather },
  { slug: "smart-home", name: "Smart Home", group: "Life", icon: Home20Regular, entries: smartHome },
  { slug: "fitness", name: "Fitness", group: "Life", icon: Run20Regular, entries: fitness },
];

export const total = categories.reduce((n, c) => n + c.entries.length, 0);

/**
 * Every widget's source, loaded on demand for the inspector's code tab. The
 * public demo build (VITE_DEMO=1) leaves the sources out of the bundle.
 */
const sources: Record<string, () => Promise<string>> =
  import.meta.env.VITE_DEMO === "1"
    ? {}
    : (import.meta.glob("../widgets/*/*.tsx", { query: "?raw", import: "default" }) as Record<
        string,
        () => Promise<string>
      >);

export function loadSource(category: string, id: string): Promise<string> {
  const load = sources[`../widgets/${category}/${id}.tsx`];
  return load ? load() : Promise.resolve("// source not found");
}
