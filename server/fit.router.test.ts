import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./fitDb", () => ({
  listFitRecords: vi.fn(),
  appendFitRecord: vi.fn(),
  getFitPreferences: vi.fn(),
  upsertFitPreferences: vi.fn(),
  removeFitProfile: vi.fn(),
}));
vi.mock("./db", () => ({ getDb: vi.fn() }));

import * as fitDb from "./fitDb";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const customer = (id: number): AuthenticatedUser => ({
  id, openId: `customer-${id}`, email: `c${id}@example.com`, name: "Client", loginMethod: "manus", role: "user",
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"), lastSignedIn: new Date("2026-01-01"),
});
const callerFor = (user: AuthenticatedUser | null) => appRouter.createCaller({ user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
const core = {
  height: { value: "182", unit: "cm" as const },
  chest: { value: "40", unit: "in" as const },
  naturalWaist: { value: "84", unit: "cm" as const },
  seat: { value: "100", unit: "cm" as const },
};
const record = (overrides: Record<string, unknown> = {}) => ({
  id: 1, userId: 42, version: 1, source: "customer_manual", registryVersion: 1,
  measurements: { height: { value: "182", unit: "cm", valueUm: 1820000 } }, verification: null,
  confirmedAt: new Date("2026-10-01T00:00:00Z"), createdAt: new Date("2026-10-01T00:00:00Z"), ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe("My DERVALLON Fit router", () => {
  it("rejects every fit procedure without an authenticated session", async () => {
    const caller = callerFor(null);
    await expect(caller.account.fitProfile.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: core })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.fitProfile.savePreferences({ jacketFit: "balanced" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.fitProfile.remove()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fitDb.appendFitRecord).not.toHaveBeenCalled();
  });

  it("reads only the signed-in customer's records and separates current from history", async () => {
    vi.mocked(fitDb.listFitRecords).mockResolvedValueOnce([record({ version: 2 }), record({ version: 1, source: "assisted" })] as never);
    vi.mocked(fitDb.getFitPreferences).mockResolvedValueOnce(null);
    const result = await callerFor(customer(42)).account.fitProfile.get();
    expect(fitDb.listFitRecords).toHaveBeenCalledWith(42, expect.any(Number));
    expect(fitDb.getFitPreferences).toHaveBeenCalledWith(42);
    expect(result.current?.version).toBe(2);
    expect(result.history.map(({ version }) => version)).toEqual([1]);
    expect(result.current).not.toHaveProperty("userId");
    expect(result.preferences).toBeNull();
  });

  it("stores the original values with server-computed canonical values and a manual source", async () => {
    vi.mocked(fitDb.appendFitRecord).mockImplementationOnce(async (_userId, input) => record({ measurements: input.measurements }) as never);
    await callerFor(customer(42)).account.fitProfile.confirmMeasurements({ measurements: core });
    expect(fitDb.appendFitRecord).toHaveBeenCalledWith(42, expect.objectContaining({
      source: "customer_manual",
      registryVersion: 1,
      measurements: expect.objectContaining({ chest: { value: "40", unit: "in", valueUm: 1016000 }, height: { value: "182", unit: "cm", valueUm: 1820000 } }),
    }));
  });

  it("refuses client attempts to choose the owner, source, canonical value or confidence", async () => {
    const caller = callerFor(customer(42));
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: core, userId: 7 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: core, source: "future_3d_scan" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: { ...core, chest: { value: "40", unit: "in", valueUm: 1 } } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: core, verification: { confidence: 0.99 } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fitDb.appendFitRecord).not.toHaveBeenCalled();
  });

  it("blocks clearly invalid or incomplete profiles but accepts unusual, possible values", async () => {
    const caller = callerFor(customer(42));
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: { ...core, chest: { value: "-3", unit: "cm" } } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: { height: core.height } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    vi.mocked(fitDb.appendFitRecord).mockResolvedValueOnce(record() as never);
    await expect(caller.account.fitProfile.confirmMeasurements({ measurements: { ...core, stomach: { value: "190", unit: "cm" } } })).resolves.toMatchObject({ version: 1 });
  });

  it("saves fit preferences separately for the signed-in customer only", async () => {
    vi.mocked(fitDb.upsertFitPreferences).mockResolvedValueOnce({ jacketFit: "closer", trouserFit: null, notes: "", updatedAt: new Date() } as never);
    await callerFor(customer(42)).account.fitProfile.savePreferences({ jacketFit: "closer", trouserFit: null, notes: "" });
    expect(fitDb.upsertFitPreferences).toHaveBeenCalledWith(42, { jacketFit: "closer", trouserFit: null, notes: "" });
    await expect(callerFor(customer(42)).account.fitProfile.savePreferences({ jacketFit: "closer", userId: 7 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("removes only the signed-in customer's fit data", async () => {
    vi.mocked(fitDb.removeFitProfile).mockResolvedValueOnce({ success: true });
    await callerFor(customer(9)).account.fitProfile.remove();
    expect(fitDb.removeFitProfile).toHaveBeenCalledWith(9);
  });
});
