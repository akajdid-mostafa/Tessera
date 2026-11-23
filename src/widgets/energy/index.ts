import type { WidgetEntry } from "@/catalog/types";
import { BessBlocksWidget } from "./bess-blocks";
import { GridFrequencyWidget } from "./grid-frequency";
import { SolarForecastWidget } from "./solar-forecast";
import { SubstationWidget } from "./substation";
import { WindTurbineWidget } from "./wind-turbine";
import { PowerQualityWidget } from "./power-quality";
import { TransformerWidget } from "./transformer";
import { InverterMatrixWidget } from "./inverter-matrix";
import { DispatchScheduleWidget } from "./dispatch-schedule";

export const entries: WidgetEntry[] = [
  {
    id: "grid-frequency",
    title: "Grid Frequency",
    size: "small",
    description:
      "System frequency as a pointer on a ±0.2 Hz arc with the ±50 mHz deadband shaded; it jitters live, turns amber through a generator-trip dip, and a tap pages to today's in-band share and min–max range.",
    Component: GridFrequencyWidget,
  },
  {
    id: "wind-turbine",
    title: "Wind Turbine",
    size: "small",
    description:
      "One turbine's output, rotor rpm and hub wind on a cut-in / rated / cut-out scale; the rotor spins at the rpm the gusting wind gives it, and a tap steps to the next turbine, including one stopped for icing.",
    Component: WindTurbineWidget,
  },
  {
    id: "solar-forecast",
    title: "Solar vs Forecast",
    size: "medium",
    description:
      "A solar plant's output traced against its day-ahead P50 line and P10–P90 band, with the cloud-driven stretch under P10 drawn in amber; scrub any 15-minute interval to read it in the hero.",
    Component: SolarForecastWidget,
  },
  {
    id: "bess-blocks",
    title: "Battery Blocks",
    size: "medium",
    description:
      "A battery site's four blocks as rows of SoC, temperature, cell spread and MW, with one block flagged priority 3 for cell imbalance; SoC drains live as the site discharges and each row reveals its cell extremes on hover.",
    Component: BessBlocksWidget,
  },
  {
    id: "substation",
    title: "Substation Single-Line",
    size: "large",
    description:
      "A 132/33 kV single-line diagram with red-closed / green-open breakers, load flowing down live conductors and a flashing feeder trip; acknowledge it, then tap a breaker to select, confirm and operate it while the line re-energises.",
    Component: SubstationWidget,
  },
  {
    id: "power-quality",
    title: "Power Quality",
    size: "small",
    description:
      "A bus's 3rd–13th harmonics as bars against IEEE 519 limit ticks with the 5th over its limit, jittering live; tap to swap voltage THD and current TDD, and hover a bar to read it.",
    Component: PowerQualityWidget,
  },
  {
    id: "transformer",
    title: "Transformer",
    size: "medium",
    description:
      "A 132/33 kV transformer drawn with its radiators and fan banks, one fan failed and the hot spot creeping toward its H limit on a bar with H/HH ticks; raise or lower the tap changer and the controls lock out while it travels.",
    Component: TransformerWidget,
  },
  {
    id: "inverter-matrix",
    title: "Inverter Matrix",
    size: "medium",
    description:
      "Forty solar inverters as a greyscale field of tiles that dim as a cloud shadow drifts across, with derated, comms-lost and tripped units marked by shape; hover a tile for its readings and tap the flashing trip to acknowledge.",
    Component: InverterMatrixWidget,
  },
  {
    id: "dispatch-schedule",
    title: "Dispatch Schedule",
    size: "large",
    description:
      "A battery's 24-hour plan as diverging charge and discharge bars with its SoC line and a price strip, the NOW line sliding and filling the delivered hour live; scrub any hour to read it and switch MW to € to see what it earns.",
    Component: DispatchScheduleWidget,
  },
];
