import { describe, expect, it } from "vitest";
import { resolveDispatchDateFromHistoryPayload, toIsoDateOrToday } from "@/lib/accountingDates";

describe("resolveDispatchDateFromHistoryPayload", () => {
  it("supports persisted object payloads and picks earliest dispatched date", () => {
    const payload = {
      deliveryHistory: [
        { status: "pending", deliveryDate: "2026-03-11" },
        { status: "dispatched", deliveryDate: "2026-03-12" },
        { status: "completed", deliveryDate: "2026-03-10" },
      ],
    };

    expect(resolveDispatchDateFromHistoryPayload(payload)).toBe("2026-03-10");
  });

  it("supports legacy array payloads", () => {
    const payload = [
      { deliveryDate: "2026-04-21" },
      { deliveryDate: "2026-04-19" },
    ];

    expect(resolveDispatchDateFromHistoryPayload(payload)).toBe("2026-04-19");
  });
});

describe("toIsoDateOrToday", () => {
  it("preserves date-only strings", () => {
    expect(toIsoDateOrToday("2026-02-06")).toBe("2026-02-06");
  });
});
