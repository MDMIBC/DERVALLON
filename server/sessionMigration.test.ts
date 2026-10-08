import express from "express";
import http from "node:http";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { registerOAuthRoutes } from "./_core/oauth";
import { sdk } from "./_core/sdk";

const previous = { appId: ENV.appId, cookieSecret: ENV.cookieSecret };
let server: Server;
let base: string;
beforeEach(async () => {
  ENV.appId = "site-a";
  ENV.cookieSecret = "test-secret-at-least-32-bytes-long";
  const app = express();
  registerOAuthRoutes(app);
  app.get("*", (_req, res) => res.status(200).send("public document or asset"));
  server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no test port");
  base = `http://127.0.0.1:${address.port}`;
});
afterEach(async () => {
  ENV.appId = previous.appId;
  ENV.cookieSecret = previous.cookieSecret;
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});
const token = (name: string) => sdk.signSession({ openId: `qa-${name}`, appId: "site-a", name }, { expiresInMs: 60_000 });
const header = (value: string, path = "/") => ({
  "cookie": `app_session_id=${value}`,
  "accept": "text/html,application/xhtml+xml",
  "sec-fetch-mode": "navigate",
  "x-forwarded-proto": "https",
});
const get = (path: string, headers: Record<string, string> = {}): Promise<Response> =>
  new Promise((resolve, reject) => {
    http.get(base + path, { headers }, (incoming) => {
      const rawHeaders: [string, string][] = [];
      for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
        rawHeaders.push([incoming.rawHeaders[i], incoming.rawHeaders[i + 1]]);
      }
      incoming.resume();
      incoming.on("end", () => resolve(new Response(null, { status: incoming.statusCode, headers: rawHeaders })));
      incoming.on("error", reject);
    }).on("error", reject);
  });
const cookieLines = (response: Response) => response.headers.getSetCookie();

describe("legacy Path=/ session migration", () => {
  it("redirects a browser document carrying a root-path cookie before any asset can start", async () => {
    const root = await token("Customer A");
    const response = await get("/account/orders?source=nav", header(root));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/api/session/migrate?next=%2Faccount%2Forders%3Fsource%3Dnav");
    expect(cookieLines(response)).toHaveLength(0);
  });

  it("migrates an HTML navigation from a browser that omits Sec-Fetch-Mode", async () => {
    const root = await token("Customer A");
    const { "sec-fetch-mode": _mode, ...olderBrowser } = header(root);
    const response = await get("/", olderBrowser);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/api/session/migrate?next=%2F");
  });

  it("preserves a valid legacy session at /api without making the browser-session cookie persistent", async () => {
    const root = await token("Customer A");
    const response = await get("/api/session/migrate?next=%2Faccount", { cookie: `app_session_id=${root}`, "x-forwarded-proto": "https" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/account");
    const cookies = cookieLines(response);
    expect(cookies).toHaveLength(2);
    expect(cookies.some(line => line.startsWith("app_session_id=;") && line.includes("Path=/;") && line.includes("Max-Age=-1"))).toBe(true);
    const migrated = cookies.find(line => line.startsWith(`app_session_id=${root};`));
    expect(migrated).toContain("Path=/api");
    expect(migrated).toContain("HttpOnly");
    expect(migrated).toContain("Secure");
    expect(migrated).toContain("SameSite=None");
    expect(migrated).not.toMatch(/Max-Age=|Expires=/i);
  });

  it("keeps the active API identity when two same-name cookies exist and clears the stale root one", async () => {
    const active = await token("Customer A");
    const stale = await token("Customer B");
    const response = await get("/api/session/migrate?next=%2Faccount", { cookie: `app_session_id=${active}; app_session_id=${stale}`, "x-forwarded-proto": "https" });
    expect(response.status).toBe(303);
    const cookies = cookieLines(response);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toContain("Path=/;");
    expect(cookies[0]).toContain("Max-Age=-1");
    expect(cookies[0]).not.toContain(active);
    expect(cookies[0]).not.toContain(stale);
  });

  it("drops invalid or expired root cookies without granting a new API session", async () => {
    const expired = await sdk.signSession({ openId: "qa-a", appId: "site-a", name: "Customer A" }, { expiresInMs: -60_000 });
    for (const value of ["garbage", expired]) {
      const response = await get("/api/session/migrate?next=%2F", { cookie: `app_session_id=${value}`, "x-forwarded-proto": "https" });
      expect(response.status).toBe(303);
      expect(cookieLines(response)).toHaveLength(1);
      expect(cookieLines(response)[0]).toContain("Max-Age=-1");
    }
  });

  it("does not redirect image, JS or API requests even when they carry a legacy cookie", async () => {
    const root = await token("Customer A");
    for (const path of ["/manus-storage/swatch.jpg", "/assets/index.js", "/api/trpc/auth.me"]) {
      const response = await get(path, header(root));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("refuses cross-origin redirect targets supplied directly to the migration endpoint", async () => {
    const root = await token("Customer A");
    const response = await get("/api/session/migrate?next=%2F%2Fevil.example", { cookie: `app_session_id=${root}`, "x-forwarded-proto": "https" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
  });
});
