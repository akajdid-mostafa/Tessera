import type { WidgetEntry } from "@/catalog/types";
import { AirQualityWidget } from "./air-quality";
import { ForecastLargeWidget } from "./forecast-large";
import { RainNextHourWidget } from "./rain-next-hour";
import { SunArcWidget } from "./sun-arc";
import { WeatherWidget } from "./weather";
import { PollenWidget } from "./pollen";
import { RadarWidget } from "./radar";
import { UvIndexWidget } from "./uv-index";
import { WindWidget } from "./wind";

export const entries: WidgetEntry[] = [
  {
    id: "weather",
    title: "Weather",
    size: "medium",
    description: "Clouds drift over a living sky; hover an hour to preview its temperature and conditions up top.",
    Component: WeatherWidget,
  },
  {
    id: "forecast-large",
    title: "Forecast",
    size: "large",
    description: "Current conditions, the next six hours and a 5-day forecast with range bars on one shared scale; hover an hour or a day to preview it up top.",
    Component: ForecastLargeWidget,
  },
  {
    id: "air-quality",
    title: "Air Quality",
    size: "small",
    description: "US AQI on a rainbow half-gauge whose marker springs to the value as readings tick; tap to cycle PM2.5, PM10, O₃ and NO₂.",
    Component: AirQualityWidget,
  },
  {
    id: "sun-arc",
    title: "Sunrise & Sunset",
    size: "small",
    description: "The sun breathes on its day arc at the current time with the golden-hour band above the horizon; scrub the arc to read any hour.",
    Component: SunArcWidget,
  },
  {
    id: "rain-next-hour",
    title: "Next-Hour Rain",
    size: "medium",
    description: "Minute-by-minute precipitation for the next hour as a smooth area against light, moderate and heavy guides; hover to scrub any minute.",
    Component: RainNextHourWidget,
  },
  {
    id: "wind",
    title: "Wind",
    size: "small",
    description:
      "A compass whose arrow swings with the live wind, streaks drifting downwind and gusts flashing; tap to cycle mph, km/h, knots and m/s.",
    Component: WindWidget,
  },
  {
    id: "uv-index",
    title: "UV Index",
    size: "medium",
    description:
      "Today's UV as half-hour bars coloured by WHO category with the sun-protection window shaded and a live NOW bar; scrub to read any half hour and its burn time.",
    Component: UvIndexWidget,
  },
  {
    id: "pollen",
    title: "Pollen",
    size: "medium",
    description:
      "Grass, tree, weed and mould levels with a five-day heat strip per row and live counts for today; hover a day's column to switch every level to that day.",
    Component: PollenWidget,
  },
  {
    id: "radar",
    title: "Radar",
    size: "large",
    description:
      "A radar loop of a squall line crossing the city toward your pin under a severe-storm warning; play, pause or drag the timeline to read the rain over you at any frame.",
    Component: RadarWidget,
  },
];
