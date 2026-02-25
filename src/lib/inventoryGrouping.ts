export const getInventoryGroupKey = (description: string | null): string => {
  if (!description) return "ZZZ_Other";
  const d = description.toLowerCase();
  if (d.includes("standard")) return "A_Standards";
  if (d.includes("reinf") && d.includes("ledger")) return "C_Reinforced Ledgers";
  if (d.includes("ledger")) return "B_Ledgers";
  if (d.includes("toe board")) return "E_Toe Boards";
  if (d.includes("hook-on board") || d.includes("board")) return "D_Hook-on Boards";
  if (d.includes("trapdoor")) return "F_Trapdoors";
  if (d.includes("staircase")) return "G_Staircases";
  if (d.includes("ladder")) return "H_Ladders";
  if (d.includes("coupler") || d.includes("connector") || d.includes("sleeve")) return "I_Couplers & Connectors";
  if (d.includes("base") || d.includes("jack")) return "J_Base Plates & Jacks";
  if (d.includes("castor")) return "K_Castors";
  if (d.includes("prop")) return "L_Props";
  if (d.includes("fork head")) return "M_Fork Heads";
  if (d.includes("scaffold tube") || d.includes("tube")) return "N_Scaffold Tubes";
  return "ZZZ_Other";
};

export const getInventoryGroupLabel = (groupKey: string): string => groupKey.replace(/^[A-Z]+_/, "");
