import { afterEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const previous = { appId: ENV.appId, cookieSecret: ENV.cookieSecret };
afterEach(() => { ENV.appId = previous.appId; ENV.cookieSecret = previous.cookieSecret; });

describe("session app identity", () => {
  it("accepts an unexpired signed token issued for this app", async () => {
    ENV.appId = "site-a";
    ENV.cookieSecret = "test-secret-at-least-32-bytes-long";
    const token = await sdk.signSession({ openId: "customer-a", appId: "site-a", name: "Customer A" });
    expect(await sdk.verifySession(token)).toMatchObject({ openId: "customer-a", appId: "site-a" });
  });

  it("rejects a correctly signed token issued for a different app", async () => {
    ENV.appId = "site-a";
    ENV.cookieSecret = "test-secret-at-least-32-bytes-long";
    const token = await sdk.signSession({ openId: "customer-a", appId: "site-b", name: "Customer A" });
    expect(await sdk.verifySession(token)).toBeNull();
  });

  it("rejects an expired token for the correct app", async () => {
    ENV.appId = "site-a";
    ENV.cookieSecret = "test-secret-at-least-32-bytes-long";
    const token = await sdk.signSession({ openId: "customer-a", appId: "site-a", name: "Customer A" }, { expiresInMs: -60_000 });
    expect(await sdk.verifySession(token)).toBeNull();
  });

  it("rejects a signed token with no expiration so it cannot become an indefinite migrated cookie", async () => {
    ENV.appId = "site-a";
    ENV.cookieSecret = "test-secret-at-least-32-bytes-long";
    const token = await new SignJWT({ openId: "customer-a", appId: "site-a", name: "Customer A" })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode(ENV.cookieSecret));
    expect(await sdk.verifySession(token)).toBeNull();
  });
});
