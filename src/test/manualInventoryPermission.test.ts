import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
import { fetchManualInventoryPermission } from "@/lib/manualInventoryPermission";

describe("Add Scaffold inventory permission", () => {
  beforeEach(() => rpc.mockReset());
  it("allows Angela when the server confirms permission", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await fetchManualInventoryPermission()).toBe(true);
    expect(rpc).toHaveBeenCalledWith("can_manage_manual_inventory");
  });
  it("denies other users when the server returns false", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await fetchManualInventoryPermission()).toBe(false);
  });
  it("does not grant permission when the server returns no result", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await fetchManualInventoryPermission()).toBe(false);
  });
  it("does not grant permission when verification fails", async () => {
    const error = new Error("Permission unavailable");
    rpc.mockResolvedValue({ data: null, error });
    await expect(fetchManualInventoryPermission()).rejects.toThrow(error);
  });
});