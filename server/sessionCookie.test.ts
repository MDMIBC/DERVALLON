import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";

// Hosting mitigation regression tests.
// On the published Manus hosting edge, a request to /manus-storage/* that
// carries a valid non-owner app_session_id cookie is answered 404 by the edge
// (the DERVALLON Express app never receives it). The session cookie is
// therefore scoped to /api, the only place the server reads it.

const dbMock = vi.hoisted(() => ({ upsertUser: vi.fn(async () => undefined) }));
const sdkMock = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(async () => ({ accessToken: "access-token" })),
  getUserInfo: vi.fn(async () => ({
    openId: "customer-open-id",
    name: "Customer",
    email: "customer@example.invalid",
    loginMethod: "google",
  })),
  createSessionToken: vi.fn(async () => "signed-session-token"),
}));
vi.mock("./db", () => dbMock);
vi.mock("./_core/sdk", () => ({ sdk: sdkMock }));

import {
  LEGACY_SESSION_COOKIE_PATH,
  SESSION_COOKIE_PATH,
  getSessionCookieOptions,
} from "./_core/cookies";
import { registerOAuthRoutes } from "./_core/oauth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieWrite = { kind: "set" | "clear"; name: string; value?: string; options: Record<string, unknown> };

function fakeResponse() {
  const writes: CookieWrite[] = [];
  const res = {
    statusCode: 200,
    redirectedTo: "",
    cookie(name: string, value: string, options: Record<string, unknown>) {
      writes.push({ kind: "set", name, value, options });
      return res;
    },
    clearCookie(name: string, options: Record<string, unknown>) {
      writes.push({ kind: "clear", name, options });
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json() {
      return res;
    },
    redirect(code: number, to: string) {
      res.statusCode = code;
      res.redirectedTo = to;
      return res;
    },
  };
  return { res, writes };
}

const httpsRequest = { protocol: "https", headers: {} } as unknown as Parameters<typeof getSessionCookieOptions>[0];

describe("session cookie scope (hosting mitigation)", () => {
  it("scopes the session cookie to /api and keeps it httpOnly, secure and SameSite=None", () => {
    expect(SESSION_COOKIE_PATH).toBe("/api");
    expect(LEGACY_SESSION_COOKIE_PATH).toBe("/");
    expect(getSessionCookieOptions(httpsRequest)).toEqual({
      httpOnly: true,
      path: "/api",
      sameSite: "none",
      secure: true,
    });
  });

  it("covers every server endpoint that reads the session", () => {
    const root = path.resolve(import.meta.dirname, "..");
    const serverEntry = readFileSync(path.join(root, "server/_core/index.ts"), "utf8");
    const oauth = readFileSync(path.join(root, "server/_core/oauth.ts"), "utf8");
    const clientMain = readFileSync(path.join(root, "client/src/main.tsx"), "utf8");
    expect(serverEntry).toContain('"/api/trpc"');
    expect(oauth).toContain('"/api/oauth/callback"');
    expect(oauth).toContain('"/api/session/migrate"');
    expect(clientMain).toMatch(/url:\s*"\/api\/trpc"/);
    for (const endpoint of ["/api/trpc", "/api/oauth/callback", "/api/session/migrate"]) {
      expect(endpoint.startsWith(`${SESSION_COOKIE_PATH}/`)).toBe(true);
    }
    // Public assets must never fall inside the session cookie's scope.
    for (const asset of ["/manus-storage/DMSans-latin_6943c273.woff2", "/assets/index.js", "/favicon.ico", "/"]) {
      expect(asset === SESSION_COOKIE_PATH || asset.startsWith(`${SESSION_COOKIE_PATH}/`)).toBe(false);
    }
  });
});

describe("OAuth callback cookie writes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets the session at /api and removes any legacy site-wide session cookie", async () => {
    let handler: ((req: unknown, res: unknown) => Promise<void>) | undefined;
    registerOAuthRoutes({
      use: () => undefined,
      get: (route: string, fn: typeof handler) => {
        if (route === "/api/oauth/callback") handler = fn;
      },
    } as never);
    expect(handler).toBeDefined();

    const state = Buffer.from(JSON.stringify({ redirectUri: "https://dervallon.com/api/oauth/callback", nonce: "n-1" })).toString("base64");
    const req = {
      protocol: "https",
      headers: { cookie: "__Host-oauth_state=n-1" },
      query: { code: "code-1", state },
    };
    const { res, writes } = fakeResponse();
    await handler!(req, res);

    expect(res.statusCode).toBe(302);
    const sessionSets = writes.filter((w) => w.kind === "set" && w.name === COOKIE_NAME);
    expect(sessionSets).toHaveLength(1);
    expect(sessionSets[0].value).toBe("signed-session-token");
    expect(sessionSets[0].options).toMatchObject({ path: "/api", httpOnly: true, secure: true, sameSite: "none" });

    const legacyClear = writes.find((w) => w.kind === "clear" && w.name === COOKIE_NAME && w.options.path === "/");
    expect(legacyClear).toBeDefined();
    // The legacy cookie is removed before the new scoped cookie is written.
    expect(writes.indexOf(legacyClear!)).toBeLessThan(writes.indexOf(sessionSets[0]));
  });
});

describe("auth.logout cookie writes", () => {
  it("clears both the /api session cookie and any legacy site-wide one", async () => {
    const { res, writes } = fakeResponse();
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} },
      res,
    } as unknown as TrpcContext;
    const result = await appRouter.createCaller(ctx).auth.logout();
    expect(result).toEqual({ success: true });
    const clears = writes.filter((w) => w.kind === "clear" && w.name === COOKIE_NAME);
    expect(clears.map((w) => w.options.path).sort()).toEqual(["/", "/api"]);
    for (const c of clears) {
      expect(c.options).toMatchObject({ maxAge: -1, httpOnly: true, secure: true, sameSite: "none" });
    }
    expect(writes.some((w) => w.kind === "set")).toBe(false);
  });
});
