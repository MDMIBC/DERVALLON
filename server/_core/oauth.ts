import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { clearLegacySessionCookie, getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Existing customers may still hold a Path=/ cookie from before the storage
  // mitigation. A document navigation must migrate it BEFORE the browser starts
  // loading public /manus-storage/* assets (which the hosted edge otherwise 404s).
  app.use((req: Request, res: Response, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") ||
        req.path.startsWith("/assets/") || req.path.startsWith("/manus-storage/") ||
        (req.headers["sec-fetch-mode"] !== undefined && req.headers["sec-fetch-mode"] !== "navigate") ||
        !/text\/html|application\/xhtml\+xml/i.test(req.headers.accept ?? "") ||
        !req.headers.cookie?.includes(`${COOKIE_NAME}=`)) {
      next();
      return;
    }
    res.set("Cache-Control", "no-store");
    res.redirect(302, `/api/session/migrate?next=${encodeURIComponent(req.originalUrl)}`);
  });

  app.get("/api/session/migrate", async (req: Request, res: Response) => {
    const requested = typeof req.query.next === "string" ? req.query.next : "/";
    const destination = requested.startsWith("/") && !requested.startsWith("//") &&
      !requested.includes("\\") && !/[\r\n]/.test(requested) &&
      !requested.startsWith("/api/") && !requested.startsWith("/assets/") &&
      !requested.startsWith("/manus-storage/") ? requested : "/";

    // Two cookies with the same name mean a new /api cookie already exists in
    // the browser: clear only the old root one, never replace the active identity.
    const sessionPairs = (req.headers.cookie ?? "").split(/;\s*/)
      .filter((part) => part.startsWith(`${COOKIE_NAME}=`));
    if (sessionPairs.length === 1) {
      const value = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
      const session = await sdk.verifySession(value);
      const remainingMs = session ? session.expiresAtSeconds * 1000 - Date.now() : 0;
      if (session && remainingMs > 0) {
        res.cookie(COOKIE_NAME, value, getSessionCookieOptions(req));
      }
    }
    clearLegacySessionCookie(req, res);
    res.set("Cache-Control", "no-store");
    res.redirect(303, destination);
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      clearLegacySessionCookie(req, res);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
