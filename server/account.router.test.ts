import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./fitDb", () => ({
  listFitRecords: vi.fn(),
  appendFitRecord: vi.fn(),
  getFitPreferences: vi.fn(),
  upsertFitPreferences: vi.fn(),
  removeFitProfile: vi.fn(),
  getFitRecordVersion: vi.fn(),
}));
vi.mock("./designsDb", () => ({
  listSavedDesigns: vi.fn(),
  getSavedDesign: vi.fn(),
  createSavedDesign: vi.fn(),
  updateSavedDesign: vi.fn(),
  deleteSavedDesign: vi.fn(),
}));
vi.mock("./db", () => ({
  getDb: vi.fn(),
  updateUserProfile: vi.fn(),
  listOrders: vi.fn(),
  listWardrobeItems: vi.fn(),
}));

import * as db from "./db";
import * as designsDb from "./designsDb";
import * as fitDb from "./fitDb";
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function contextFor(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const user: AuthenticatedUser = {
  id: 42,
  openId: "customer-42",
  email: "customer@example.com",
  name: "A Customer",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  lastSignedIn: new Date("2026-01-01"),
};

describe("account router", () => {
  it("rejects account reads without an authenticated session", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.account.fitProfile.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("derives ownership from the authenticated user for fit and design writes", async () => {
    vi.mocked(fitDb.upsertFitPreferences).mockResolvedValueOnce({ id: 3, userId: 42, jacketFit: "balanced", trouserFit: null, notes: null, createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01") });
    vi.mocked(designsDb.createSavedDesign).mockResolvedValueOnce({
      id: 9,
      userId: 42,
      title: "Full suit direction",
      payload: { kind: "studio", garment: "suit", silhouette: "precise", jacketDetail: "notch", trouserDetail: "clean", profile: "later", notes: "" },
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    } as Awaited<ReturnType<typeof designsDb.createSavedDesign>>);

    const caller = appRouter.createCaller(contextFor(user));
    await caller.account.fitProfile.savePreferences({ jacketFit: "balanced" });
    await caller.account.designs.save({
      design: { kind: "studio", garment: "suit", silhouette: "precise", jacketDetail: "notch", trouserDetail: "clean", profile: "later", notes: "" },
    });

    expect(fitDb.upsertFitPreferences).toHaveBeenCalledWith(42, expect.objectContaining({ jacketFit: "balanced" }));
    expect(designsDb.createSavedDesign).toHaveBeenCalledWith(42, expect.objectContaining({ title: "Full suit direction" }));
  });

  it("returns real records only and keeps orders and wardrobe empty until a real flow exists", async () => {
    vi.mocked(designsDb.listSavedDesigns).mockResolvedValueOnce([]);
    vi.mocked(db.listOrders).mockResolvedValueOnce([]);
    vi.mocked(db.listWardrobeItems).mockResolvedValueOnce([]);

    const caller = appRouter.createCaller(contextFor(user));
    await expect(caller.account.designs.list()).resolves.toEqual([]);
    await expect(caller.account.orders.list()).resolves.toEqual([]);
    await expect(caller.account.wardrobe.list()).resolves.toEqual([]);
    expect(designsDb.listSavedDesigns).toHaveBeenCalledWith(42);
    expect(db.listOrders).toHaveBeenCalledWith(42);
    expect(db.listWardrobeItems).toHaveBeenCalledWith(42);
  });
});
