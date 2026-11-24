/**
 * OTNO Access Solutions hire rate card (March 2026), transcribed from
 * FINAL SALES RATES.pdf. Prices are KES, exclusive of VAT.
 * Inventory part numbers may be stored as either BOMI or OTNO codes.
 */
export type EquipmentRateTier = "minimum" | "target" | "premium";

export interface EquipmentRateOptions {
  minimum: { weekly: number; monthly: number };
  target: { weekly: number; monthly: number };
  premium: { weekly: number; monthly: null };
}

type RateRow = [bomiPartNumber: string, otnoPartNumber: string, options: EquipmentRateOptions];

const rateRows: RateRow[] = [
  ["140335", "OTNO-BJ-0610", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 120, monthly: null } }],
  ["1105005", "OTNO-ST-3000", { minimum: { weekly: 80, monthly: 140 }, target: { weekly: 200, monthly: 350 }, premium: { weekly: 250, monthly: null } }],
  ["1105004", "OTNO-ST-2500", { minimum: { weekly: 72, monthly: 120 }, target: { weekly: 180, monthly: 300 }, premium: { weekly: 220, monthly: null } }],
  ["1105003", "OTNO-ST-2000", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105002", "OTNO-ST-1500", { minimum: { weekly: 48, monthly: 60 }, target: { weekly: 120, monthly: 150 }, premium: { weekly: 150, monthly: null } }],
  ["1105001", "OTNO-ST-1000", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 150, monthly: null } }],
  ["1105021", "OTNO-LD-2500", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105022", "OTNO-LD-2000", { minimum: { weekly: 48, monthly: 80 }, target: { weekly: 120, monthly: 200 }, premium: { weekly: 180, monthly: null } }],
  ["1105018", "OTNO-LD-1800", { minimum: { weekly: 48, monthly: 80 }, target: { weekly: 120, monthly: 200 }, premium: { weekly: 180, monthly: null } }],
  ["1105023", "OTNO-LD-1500", { minimum: { weekly: 48, monthly: 80 }, target: { weekly: 120, monthly: 200 }, premium: { weekly: 150, monthly: null } }],
  ["1105024", "OTNO-LD-1294", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 130, monthly: null } }],
  ["1105025", "OTNO-LD-1219", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 130, monthly: null } }],
  ["1105027", "OTNO-LD-1000", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 130, monthly: null } }],
  ["1105029", "OTNO-LD-0900", { minimum: { weekly: 36, monthly: 52 }, target: { weekly: 90, monthly: 130 }, premium: { weekly: 120, monthly: null } }],
  ["1105032", "OTNO-LD-0600", { minimum: { weekly: 32, monthly: 40 }, target: { weekly: 80, monthly: 100 }, premium: { weekly: 100, monthly: null } }],
  ["1105040", "OTNO-RL-2500", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105076", "OTNO-HB-2500NT", { minimum: { weekly: 80, monthly: 140 }, target: { weekly: 200, monthly: 350 }, premium: { weekly: 250, monthly: null } }],
  ["1105076A", "OTNO-HB-2500", { minimum: { weekly: 80, monthly: 140 }, target: { weekly: 200, monthly: 350 }, premium: { weekly: 250, monthly: null } }],
  ["1105077", "OTNO-HB-2000NT", { minimum: { weekly: 64, monthly: 120 }, target: { weekly: 160, monthly: 300 }, premium: { weekly: 220, monthly: null } }],
  ["1105085A", "OTNO-HB-1500TH", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105085", "OTNO-HB-1500NT", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105070", "OTNO-HB-1294", { minimum: { weekly: 52, monthly: 88 }, target: { weekly: 130, monthly: 220 }, premium: { weekly: 180, monthly: null } }],
  ["1105085B", "OTNO-HB-0900NT", { minimum: { weekly: 48, monthly: 80 }, target: { weekly: 120, monthly: 200 }, premium: { weekly: 160, monthly: null } }],
  ["1105120", "OTNO-TB-2500", { minimum: { weekly: 60, monthly: 100 }, target: { weekly: 150, monthly: 250 }, premium: { weekly: 200, monthly: null } }],
  ["1105119", "OTNO-TB-2000", { minimum: { weekly: 48, monthly: 80 }, target: { weekly: 120, monthly: 200 }, premium: { weekly: 160, monthly: null } }],
  ["1105118", "OTNO-TB-1500", { minimum: { weekly: 36, monthly: 60 }, target: { weekly: 90, monthly: 150 }, premium: { weekly: 130, monthly: null } }],
  ["1105151", "OTNO-TB-0900", { minimum: { weekly: 20, monthly: 32 }, target: { weekly: 50, monthly: 80 }, premium: { weekly: 80, monthly: null } }],
  ["1105121", "OTNO-TC-0001", { minimum: { weekly: 20, monthly: 32 }, target: { weekly: 50, monthly: 80 }, premium: { weekly: 80, monthly: null } }],
  ["1105500", "OTNO-SC-2500", { minimum: { weekly: 600, monthly: 800 }, target: { weekly: 1500, monthly: 2000 }, premium: { weekly: 2000, monthly: null } }],
  ["1105511", "OTNO-SR-0001", { minimum: { weekly: 160, monthly: 240 }, target: { weekly: 400, monthly: 600 }, premium: { weekly: 600, monthly: null } }],
  ["1105504", "OTNO-LH-2000", { minimum: { weekly: 60, monthly: 80 }, target: { weekly: 150, monthly: 201 }, premium: { weekly: 200, monthly: null } }],
  ["1105512", "OTNO-LH-1000", { minimum: { weekly: 40, monthly: 60 }, target: { weekly: 100, monthly: 150 }, premium: { weekly: 150, monthly: null } }],
  ["1105111", "OTNO-TD-3B", { minimum: { weekly: 80, monthly: 172 }, target: { weekly: 200, monthly: 431 }, premium: { weekly: 350, monthly: null } }],
  ["1105112", "OTNO-TD-2B", { minimum: { weekly: 80, monthly: 134 }, target: { weekly: 200, monthly: 334 }, premium: { weekly: 300, monthly: null } }],
  ["1105016", "OTNO-CQ-5050", { minimum: { weekly: 12, monthly: 18 }, target: { weekly: 30, monthly: 45 }, premium: { weekly: 40, monthly: null } }],
  ["1105059", "OTNO-CS-5050", { minimum: { weekly: 12, monthly: 18 }, target: { weekly: 30, monthly: 45 }, premium: { weekly: 40, monthly: null } }],
  ["145341", "OTNO-CN-0001", { minimum: { weekly: 8, monthly: 14 }, target: { weekly: 20, monthly: 35 }, premium: { weekly: 35, monthly: null } }],
  ["2710684", "OTNO-SL-0001", { minimum: { weekly: 10, monthly: 17 }, target: { weekly: 25, monthly: 43 }, premium: { weekly: 40, monthly: null } }],
  ["1905151", "OTNO-TU-6000", { minimum: { weekly: 120, monthly: 160 }, target: { weekly: 300, monthly: 400 }, premium: { weekly: 400, monthly: null } }],
  ["1905097", "OTNO-TU-5000", { minimum: { weekly: 80, monthly: 140 }, target: { weekly: 200, monthly: 350 }, premium: { weekly: 300, monthly: null } }],
  ["1905096", "OTNO-TU-4500", { minimum: { weekly: 72, monthly: 120 }, target: { weekly: 180, monthly: 300 }, premium: { weekly: 260, monthly: null } }],
  ["1905095", "OTNO-TU-4000", { minimum: { weekly: 64, monthly: 108 }, target: { weekly: 160, monthly: 270 }, premium: { weekly: 230, monthly: null } }],
  ["1905094", "OTNO-TU-3500", { minimum: { weekly: 56, monthly: 96 }, target: { weekly: 140, monthly: 240 }, premium: { weekly: 200, monthly: null } }],
  ["1905093", "OTNO-TU-3000", { minimum: { weekly: 52, monthly: 84 }, target: { weekly: 130, monthly: 210 }, premium: { weekly: 150, monthly: null } }],
  ["1905092", "OTNO-TU-2500", { minimum: { weekly: 44, monthly: 72 }, target: { weekly: 110, monthly: 180 }, premium: { weekly: 140, monthly: null } }],
  ["1905091", "OTNO-TU-2000", { minimum: { weekly: 40, monthly: 68 }, target: { weekly: 100, monthly: 170 }, premium: { weekly: 120, monthly: null } }],
  ["1905089", "OTNO-TU-1500", { minimum: { weekly: 32, monthly: 52 }, target: { weekly: 80, monthly: 130 }, premium: { weekly: 100, monthly: null } }],
  ["1905087", "OTNO-TU-1000", { minimum: { weekly: 20, monthly: 36 }, target: { weekly: 50, monthly: 90 }, premium: { weekly: 80, monthly: null } }],
  ["425112", "OTNO-JC-0001", { minimum: { weekly: 120, monthly: 200 }, target: { weekly: 300, monthly: 500 }, premium: { weekly: 500, monthly: null } }],
  ["425113", "OTNO-CB-0001", { minimum: { weekly: 100, monthly: 160 }, target: { weekly: 250, monthly: 400 }, premium: { weekly: 400, monthly: null } }],
];

const ratesByPartNumber = new Map<string, EquipmentRateOptions>();
for (const [bomi, otno, options] of rateRows) {
  ratesByPartNumber.set(bomi.toUpperCase(), options);
  ratesByPartNumber.set(otno.toUpperCase(), options);
}

export const getEquipmentRateOptions = (partNumber: string | null | undefined) => {
  const key = (partNumber ?? "").trim().toUpperCase();
  return key ? ratesByPartNumber.get(key) : undefined;
};

export const getEquipmentTargetWeeklyRate = (partNumber: string | null | undefined) =>
  getEquipmentRateOptions(partNumber)?.target.weekly;

export const getEquipmentRateTierForWeeklyRate = (
  partNumber: string | null | undefined,
  weeklyRate: number
): EquipmentRateTier | "custom" => {
  const options = getEquipmentRateOptions(partNumber);
  if (!options) return "custom";

  const matchingTier = (["minimum", "target", "premium"] as const).find(
    (tier) => options[tier].weekly === weeklyRate
  );

  return matchingTier ?? "custom";
};
