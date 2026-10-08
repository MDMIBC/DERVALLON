import type { CookieOptions, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";

/**
 * HOSTING MITIGATION (2026-10-07) — not an architectural root fix.
 *
 * On the published Manus hosting edge, a /manus-storage/* request that carries
 * a valid, non-owner `app_session_id` cookie is answered `404 Not found` by the
 * edge itself (the DERVALLON Express app never receives it), so signed-in
 * customers lost fonts, the emblem and every fabric swatch. The server only
 * reads the session under /api (/api/trpc and /api/oauth/callback), so the
 * cookie is scoped to /api and is no longer attached to public asset requests.
 *
 * Existing root-path sessions are migrated on their next HTML navigation, before
 * asset requests start; OAuth login and logout also clear the legacy cookie.
 * Revert only after Manus confirms the edge fix AND a new signed-out/customer/
 * owner production matrix on every domain proves /manus-storage/* remains public
 * with the customer root cookie. Recheck /api auth, logout and legacy sessions.
 */
export const SESSION_COOKIE_PATH = "/api";
/** Path used by sessions issued before the mitigation; cleared on sign-in and sign-out. */
export const LEGACY_SESSION_COOKIE_PATH = "/";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  return {
    httpOnly: true,
    path: SESSION_COOKIE_PATH,
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}

/** Expires a session cookie previously issued site-wide (Path=/). */
export function clearLegacySessionCookie(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, {
    ...getSessionCookieOptions(req),
    path: LEGACY_SESSION_COOKIE_PATH,
    maxAge: -1,
  });
}
