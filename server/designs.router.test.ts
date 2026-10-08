import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./designsDb", () => ({
  listSavedDesigns: vi.fn(),
  getSavedDesign: vi.fn(),
  createSavedDesign: vi.fn(),
  updateSavedDesign: vi.fn(),
  deleteSavedDesign: vi.fn(),
}));
vi.mock("./fitDb", () => ({
  listFitRecords: vi.fn(),
  appendFitRecord: vi.fn(),
  getFitPreferences: vi.fn(),
  upsertFitPreferences: vi.fn(),
  removeFitProfile: vi.fn(),
  getFitRecordVersion: vi.fn(),
}));
vi.mock("./db", () => ({
  getDb: vi.fn(),
  updateUserProfile: vi.fn(),
  listOrders: vi.fn(),
  listWardrobeItems: vi.fn(),
}));

import * as designsDb from "./designsDb";
import * as fitDb from "./fitDb";
import * as db from "./db";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const customer = (id: number): AuthenticatedUser => ({
  id, openId: `customer-${id}`, email: `customer${id}@example.com`, name: `Customer ${id}`, loginMethod: "manus", role: "user",
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"), lastSignedIn: new Date("2026-01-01"),
});
const contextFor = (user: AuthenticatedUser | null): TrpcContext => ({
  user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"],
});
const row = (overrides: Partial<{ id: number; userId: number; title: string; payload: unknown }> = {}) => ({
  id: 7, userId: 42, title: "Full suit direction",
  payload: { kind: "studio", garment: "suit", silhouette: "precise", jacketDetail: "notch", trouserDetail: "clean", notes: "" },
  createdAt: new Date("2026-09-01T00:00:00Z"), updatedAt: new Date("2026-09-02T00:00:00Z"),
  ...overrides,
}) as never;
const bespoke = {
  kind: "bespoke" as const,
  fabricId: "stella:HERITAGE:2701",
  silhouette: "tailored",
  lapel: "peak",
  measurementMode: "manual" as const,
  measurements: { chest: "102.5", waist: "", seat: "", shoulder: "", sleeve: "", inseam: "" },
};

beforeEach(() => { vi.clearAllMocks(); });

describe("saved designs router", () => {
  it("rejects every saved-design procedure without an authenticated session", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.account.designs.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.designs.get({ id: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.designs.save({ design: { kind: "studio", notes: "" } })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.account.designs.delete({ id: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(designsDb.listSavedDesigns).not.toHaveBeenCalled();
    expect(designsDb.createSavedDesign).not.toHaveBeenCalled();
  });

  it("saves a Design Studio direction for the signed-in customer with a server-derived title", async () => {
    vi.mocked(designsDb.createSavedDesign).mockResolvedValueOnce(row());
    const caller = appRouter.createCaller(contextFor(customer(42)));
    const saved = await caller.account.designs.save({ design: { kind: "studio", garment: "suit", silhouette: "precise", jacketDetail: "notch", trouserDetail: "clean", notes: "" } });
    expect(designsDb.createSavedDesign).toHaveBeenCalledWith(42, {
      title: "Full suit direction",
      payload: { kind: "studio", garment: "suit", silhouette: "precise", jacketDetail: "notch", trouserDetail: "clean", profile: undefined, notes: "" },
    });
    expect(saved).not.toHaveProperty("userId");
    expect(saved).toMatchObject({ id: 7, kind: "studio", title: "Full suit direction" });
  });

  it("never lets the browser choose the owner or add unsupported fields", async () => {
    const caller = appRouter.createCaller(contextFor(customer(42)));
    await expect(caller.account.designs.save({ userId: 99, design: { kind: "studio", notes: "" } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { kind: "studio", notes: "", userId: 99 } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { ...bespoke, price: "1200" } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { ...bespoke, orderNumber: "A1" } } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(designsDb.createSavedDesign).not.toHaveBeenCalled();
  });

  it("only accepts fabric, silhouette, lapel and studio options that exist on the site", async () => {
    const caller = appRouter.createCaller(contextFor(customer(42)));
    await expect(caller.account.designs.save({ design: { ...bespoke, fabricId: "stella:HERITAGE:0000" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { ...bespoke, silhouette: "oversized" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { ...bespoke, lapel: "shawl" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { kind: "studio", garment: "cape", notes: "" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.account.designs.save({ design: { ...bespoke, measurements: { ...bespoke.measurements, chest: "abc" } } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(designsDb.createSavedDesign).not.toHaveBeenCalled();
  });

  it("stores a Bespoke Studio design with its exact fabric reference and manual measurements", async () => {
    vi.mocked(designsDb.createSavedDesign).mockResolvedValueOnce(row({ title: "HERITAGE · 2701 direction", payload: { ...bespoke } }));
    const caller = appRouter.createCaller(contextFor(customer(42)));
    const saved = await caller.account.designs.save({ design: bespoke });
    expect(designsDb.createSavedDesign).toHaveBeenCalledWith(42, {
      title: "HERITAGE · 2701 direction",
      payload: { kind: "bespoke", fabricId: "stella:HERITAGE:2701", silhouette: "tailored", lapel: "peak", measurementMode: "manual", measurements: bespoke.measurements },
    });
    expect(saved.details).toEqual(expect.arrayContaining([
      { label: "Fabric", value: "HERITAGE · 2701" },
      { label: "Silhouette", value: "Tailored" },
      { label: "Lapel", value: "Peak lapel" },
    ]));
    expect(JSON.stringify(saved)).not.toMatch(/Stella/);
  });

  it("links a saved fit version only when it belongs to the signed-in customer", async () => {
    const caller = appRouter.createCaller(contextFor(customer(42)));
    vi.mocked(fitDb.getFitRecordVersion).mockResolvedValueOnce(null);
    await expect(caller.account.designs.save({ design: { ...bespoke, measurementMode: "fit_profile", measurements: undefined, fitVersion: 3 } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fitDb.getFitRecordVersion).toHaveBeenCalledWith(42, 3);

    vi.mocked(fitDb.getFitRecordVersion).mockResolvedValueOnce({ version: 2, confirmedAt: new Date("2026-09-20T00:00:00Z") } as never);
    vi.mocked(designsDb.createSavedDesign).mockResolvedValueOnce(row({ payload: { ...bespoke, measurementMode: "fit_profile", measurements: undefined, fitVersion: 2, fitConfirmedAt: "2026-09-20T00:00:00.000Z" } }));
    await caller.account.designs.save({ design: { ...bespoke, measurementMode: "fit_profile", measurements: undefined, fitVersion: 2 } });
    expect(designsDb.createSavedDesign).toHaveBeenLastCalledWith(42, expect.objectContaining({
      payload: expect.objectContaining({ measurementMode: "fit_profile", fitVersion: 2, fitConfirmedAt: "2026-09-20T00:00:00.000Z" }),
    }));
    const stored = vi.mocked(designsDb.createSavedDesign).mock.calls.at(-1)?.[1].payload as Record<string, unknown>;
    expect(stored).not.toHaveProperty("measurements");
  });

  it("lists, reads, updates and deletes only the signed-in customer's own designs", async () => {
    vi.mocked(designsDb.listSavedDesigns).mockResolvedValueOnce([row()]);
    vi.mocked(designsDb.getSavedDesign).mockResolvedValueOnce(null);
    vi.mocked(designsDb.updateSavedDesign).mockResolvedValueOnce(null);
    vi.mocked(designsDb.deleteSavedDesign).mockResolvedValueOnce({ removed: false });
    const caller = appRouter.createCaller(contextFor(customer(42)));
    const list = await caller.account.designs.list();
    expect(designsDb.listSavedDesigns).toHaveBeenCalledWith(42);
    expect(list[0]).not.toHaveProperty("userId");
    await expect(caller.account.designs.get({ id: 8 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(designsDb.getSavedDesign).toHaveBeenCalledWith(42, 8);
    await expect(caller.account.designs.save({ id: 8, design: { kind: "studio", garment: "jacket", notes: "" } })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(designsDb.updateSavedDesign).toHaveBeenCalledWith(42, 8, expect.objectContaining({ title: "Jacket direction" }));
    await expect(caller.account.designs.delete({ id: 8 })).resolves.toEqual({ removed: false });
    expect(designsDb.deleteSavedDesign).toHaveBeenCalledWith(42, 8);
  });

  it("keeps orders, wardrobe and profile responses free of owner identifiers", async () => {
    vi.mocked(db.listOrders).mockResolvedValueOnce([{ id: 1, userId: 42, createdAt: new Date("2026-01-01") }] as never);
    vi.mocked(db.listWardrobeItems).mockResolvedValueOnce([{ id: 2, userId: 42, createdAt: new Date("2026-01-01") }] as never);
    const caller = appRouter.createCaller(contextFor(customer(42)));
    const [orders, wardrobe, profile] = await Promise.all([caller.account.orders.list(), caller.account.wardrobe.list(), caller.account.profile.get()]);
    expect(orders[0]).not.toHaveProperty("userId");
    expect(wardrobe[0]).not.toHaveProperty("userId");
    expect(profile).toEqual({ name: "Customer 42", email: "customer42@example.com" });
    expect(db.listOrders).toHaveBeenCalledWith(42);
    expect(db.listWardrobeItems).toHaveBeenCalledWith(42);
  });
});
