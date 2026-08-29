/**
 * NOAA CO-OPS predictions for Newport Bay Entrance (9410580), MLLW, metric.
 *
 * The approved prototype embeds this fixture; its retrieval timestamp was not recorded.
 * It covers 2026-08-31 17:00 through 2026-09-03 16:00 PDT. The cache deliberately
 * retains hourly samples plus the exact turning points. It is not a client-side API call.
 */
export type TidePoint = readonly [minutes: number, millimeters: number, mark: "" | "H" | "L"];

export const TIDE_STATION = "9410580";
export const TIDE_STATION_NAME = "Newport Bay Entrance";
/** Aug 31, 2026 5:00pm at the station (PDT), stored as its real UTC instant. */
export const TIDE_BASE_UTC = Date.UTC(2026, 8, 1, 0, 0, 0);
/** The fixture instant used to anchor the summary and marker: 2026-09-01 09:40 PDT. */
export const TIDE_SELECTED_MINUTES = 1000;

export const TIDE_POINTS: readonly TidePoint[] = [
  [0, 376, ""], [62, 296, "L"], [120, 362, ""], [180, 545, ""], [240, 793, ""], [300, 1036, ""], [360, 1213, ""],
  [420, 1277, "H"], [480, 1215, ""], [540, 1045, ""], [600, 819, ""], [660, 603, ""], [720, 462, ""], [760, 433, "L"],
  [780, 441, ""], [840, 553, ""], [900, 778, ""], [960, 1066, ""], [1020, 1354, ""], [1080, 1576, ""], [1140, 1678, ""],
  [1152, 1682, "H"], [1200, 1634, ""], [1260, 1450, ""], [1320, 1167, ""], [1380, 849, ""], [1440, 565, ""], [1500, 374, ""],
  [1563, 304, "L"], [1620, 357, ""], [1680, 502, ""], [1740, 694, ""], [1800, 881, ""], [1860, 1013, ""], [1922, 1062, "H"],
  [1980, 1021, ""], [2040, 909, ""], [2100, 769, ""], [2160, 650, ""], [2224, 598, "L"], [2280, 642, ""], [2340, 782, ""],
  [2400, 996, ""], [2460, 1241, ""], [2520, 1467, ""], [2580, 1624, ""], [2635, 1675, "H"], [2700, 1601, ""], [2760, 1414, ""],
  [2820, 1149, ""], [2880, 858, ""], [2940, 596, ""], [3000, 408, ""], [3060, 317, ""], [3085, 309, "L"], [3120, 324, ""],
  [3180, 410, ""], [3240, 542, ""], [3300, 685, ""], [3360, 803, ""], [3420, 874, ""], [3466, 890, "H"], [3480, 888, ""],
  [3540, 856, ""], [3600, 804, ""], [3660, 764, ""], [3688, 759, "L"], [3720, 767, ""], [3780, 829, ""], [3840, 953, ""],
  [3900, 1124, ""], [3960, 1313, ""], [4020, 1487, ""], [4080, 1608, ""], [4134, 1647, "H"], [4140, 1647, ""],
  [4200, 1586, ""], [4260, 1428, ""],
];
