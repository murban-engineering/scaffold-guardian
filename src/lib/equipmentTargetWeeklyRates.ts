/**
 * Standard TARGET Weekly hire rates from FINAL SALES RATES (1).xlsx
 * (March 2026). Values are KES, exclusive of VAT.
 * Both BOMI and OTNO part numbers are accepted because inventory records may use either.
 */
const targetWeeklyRates: Record<string, number> = {
  "140335": 100, "OTNO-BJ-0610": 100,
  "1105005": 200, "OTNO-ST-3000": 200,
  "1105004": 180, "OTNO-ST-2500": 180,
  "1105003": 150, "OTNO-ST-2000": 150,
  "1105002": 120, "OTNO-ST-1500": 120,
  "1105001": 100, "OTNO-ST-1000": 100,
  "1105021": 150, "OTNO-LD-2500": 150,
  "1105022": 120, "OTNO-LD-2000": 120,
  "1105018": 120, "OTNO-LD-1800": 120,
  "1105023": 120, "OTNO-LD-1500": 120,
  "1105024": 100, "OTNO-LD-1294": 100,
  "1105025": 100, "OTNO-LD-1219": 100,
  "1105027": 100, "OTNO-LD-1000": 100,
  "1105029": 90, "OTNO-LD-0900": 90,
  "1105032": 80, "OTNO-LD-0600": 80,
  "1105040": 150, "OTNO-RL-2500": 150,
  "1105076": 200, "OTNO-HB-2500NT": 200,
  "1105076A": 200, "OTNO-HB-2500": 200,
  "1105077": 160, "OTNO-HB-2000NT": 160,
  "1105085A": 150, "OTNO-HB-1500TH": 150,
  "1105085": 150, "OTNO-HB-1500NT": 150,
  "1105070": 130, "OTNO-HB-1294": 130,
  "1105085B": 120, "OTNO-HB-0900NT": 120,
  "1105120": 150, "OTNO-TB-2500": 150,
  "1105119": 120, "OTNO-TB-2000": 120,
  "1105118": 90, "OTNO-TB-1500": 90,
  "1105151": 50, "OTNO-TB-0900": 50,
  "1105121": 50, "OTNO-TC-0001": 50,
  "1105500": 1500, "OTNO-SC-2500": 1500,
  "1105511": 400, "OTNO-SR-0001": 400,
  "1105504": 150, "OTNO-LH-2000": 150,
  "1105512": 100, "OTNO-LH-1000": 100,
  "1105111": 200, "OTNO-TD-3B": 200,
  "1105112": 200, "OTNO-TD-2B": 200,
  "1105016": 30, "OTNO-CQ-5050": 30,
  "1105059": 30, "OTNO-CS-5050": 30,
  "145341": 20, "OTNO-CN-0001": 20,
  "2710684": 25, "OTNO-SL-0001": 25,
  "1905151": 300, "OTNO-TU-6000": 300,
  "1905097": 200, "OTNO-TU-5000": 200,
  "1905096": 180, "OTNO-TU-4500": 180,
  "1905095": 160, "OTNO-TU-4000": 160,
  "1905094": 140, "OTNO-TU-3500": 140,
  "1905093": 130, "OTNO-TU-3000": 130,
  "1905092": 110, "OTNO-TU-2500": 110,
  "1905091": 100, "OTNO-TU-2000": 100,
  "1905089": 80, "OTNO-TU-1500": 80,
  "1905087": 50, "OTNO-TU-1000": 50,
  "425112": 300, "OTNO-JC-0001": 300,
  "425113": 250, "OTNO-CB-0001": 250,
};

export const getEquipmentTargetWeeklyRate = (partNumber: string | null | undefined) => {
  const key = (partNumber ?? "").trim().toUpperCase();
  return key ? targetWeeklyRates[key] : undefined;
};
