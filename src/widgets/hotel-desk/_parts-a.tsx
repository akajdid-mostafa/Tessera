/* Shared front-desk data for the room rack widgets: Seabright Villas's 100 rooms, their types and the
 * front-desk and housekeeping vocabulary the PMS uses. */

export const PROPERTY = "Seabright Villas";

export type TypeId = 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | 309 | 310;
export const ROOM_TYPES: Record<TypeId, { name: string; short: string; cleanMin: number }> = {
  301: { name: "Single Room", short: "Single", cleanMin: 45 },
  302: { name: "Standard Double", short: "Std Dbl", cleanMin: 45 },
  303: { name: "Standard Twin", short: "Std Twin", cleanMin: 45 },
  304: { name: "Superior Double", short: "Superior", cleanMin: 45 },
  305: { name: "Deluxe Garden View", short: "Dlx Garden", cleanMin: 45 },
  306: { name: "Deluxe Sea View", short: "Dlx Sea", cleanMin: 45 },
  307: { name: "Family Room", short: "Family", cleanMin: 60 },
  308: { name: "Junior Suite", short: "Jr Suite", cleanMin: 60 },
  309: { name: "Suite", short: "Suite", cleanMin: 75 },
  310: { name: "Villa", short: "Villa", cleanMin: 90 },
};

export type Housekeeping = "clean" | "dirty" | "inspected" | "pickup";
export const HK: Record<Housekeeping, { label: string; color: string }> = {
  clean: { label: "Clean", color: "var(--ios-green)" },
  inspected: { label: "Inspected", color: "var(--ios-blue)" },
  dirty: { label: "Dirty", color: "var(--ios-red)" },
  pickup: { label: "Pickup", color: "var(--ant-color-text-quaternary)" },
};

export type FrontDesk =
  | "vacant"
  | "occupied"
  | "arriving"
  | "departing"
  | "departed"
  | "turnover"
  | "out_of_order"
  | "blocked";
export const FD: Record<FrontDesk, { label: string; color: string | null; text: string }> = {
  vacant: { label: "Vacant", color: null, text: "text-secondary" },
  occupied: { label: "Occupied", color: "var(--ios-green)", text: "text-ios-green" },
  arriving: { label: "Arriving", color: "var(--ios-indigo)", text: "text-ios-indigo" },
  departing: { label: "Departing", color: "var(--ios-orange)", text: "text-ios-orange" },
  departed: { label: "Departed", color: "var(--ant-color-text-quaternary)", text: "text-secondary" },
  turnover: { label: "Turnover", color: "var(--ios-teal)", text: "text-ios-teal" },
  out_of_order: { label: "Out of order", color: "var(--ios-pink)", text: "text-ios-pink" },
  blocked: { label: "Blocked", color: "var(--ios-purple)", text: "text-ios-purple" },
};

export type Room = { id: number; number: string; type: TypeId; floor: number; hk: Housekeeping };

/* Room numbers by floor and type, in the PMS's order (ids 1–100). */
const LAYOUT: [floor: number, type: TypeId, numbers: string[]][] = [
  [1, 301, ["101", "102", "103", "104", "105", "106"]],
  [1, 302, ["107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118"]],
  [2, 302, ["201", "202", "203", "204", "205"]],
  [2, 303, ["206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219"]],
  [3, 304, ["301", "302", "303", "304", "305", "306", "307", "308", "309", "310", "311", "312"]],
  [3, 305, ["313", "314", "315", "316", "317", "318", "319", "320"]],
  [4, 305, ["401", "402"]],
  [4, 306, ["403", "404", "405", "406", "407", "408", "409", "410", "411", "412"]],
  [4, 307, ["413", "414", "415", "416", "417", "418", "419", "420", "421"]],
  [5, 308, ["501", "502", "503", "504", "505", "506", "507", "508"]],
  [6, 309, ["S1", "S2", "S3", "S4", "S5", "S6", "S7"]],
  [0, 310, ["V1", "V2", "V3", "V4", "V5", "V6", "V7"]],
];
/* Housekeeping as the morning's board has it, ids 1–100 (c clean, d dirty, i inspected, p pickup). */
const HK_CODES =
  "cccccd" + "cpddcdccidcd" + "cccid" + "dccccdccccccpd" + "cdccccccccc" + "d" + "pdcdpdic" + "cc" + "pccdddcccc" +
  "ccccdcccc" + "dccccpcc" + "ccccccc" + "dddidcc";
const HK_OF: Record<string, Housekeeping> = { c: "clean", d: "dirty", i: "inspected", p: "pickup" };

export const ROOMS: Room[] = LAYOUT.flatMap(([floor, type, numbers]) => numbers.map((number) => ({ floor, type, number })))
  .map((r, i) => ({ ...r, id: i + 1, hk: HK_OF[HK_CODES[i]] ?? "clean" }));

export const roomByNumber = (n: string) => ROOMS.find((r) => r.number === n) as Room;

/** Minutes after midnight → "HH:mm". */
export const clock = (m: number) => {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};
export const hm = (h: number, m = 0) => h * 60 + m;

/** A clock that rolls hours and minutes on their own columns. */
export const TWO = { minimumIntegerDigits: 2 } as const;
