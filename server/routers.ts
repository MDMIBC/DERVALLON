import { COOKIE_NAME } from "@shared/const";
import { clearLegacySessionCookie, getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { fitProfileRouter } from "./fitRouter";
import { designsRouter } from "./designsRouter";
import { listOrders, listWardrobeItems, updateUserProfile } from "./db";

/** Account responses never include owner ids, open ids or roles; ownership always comes from ctx.user. */
const toPublicProfile = (user: { name: string | null; email: string | null } | undefined) => ({ name: user?.name ?? null, email: user?.email ?? null });
const toPublicRecord = (row: { id: number; createdAt: Date }) => ({ id: row.id, createdAt: row.createdAt });

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      clearLegacySessionCookie(ctx.req, ctx.res);
      return {
        success: true,
      } as const;
    }),
  }),
  account: router({
    profile: router({
      get: protectedProcedure.query(({ ctx }) => toPublicProfile(ctx.user)),
      update: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => toPublicProfile(await updateUserProfile(ctx.user.id, input.name))),
    }),
    fitProfile: fitProfileRouter,
    designs: designsRouter,
    // Orders and wardrobe are read-only, empty foundations: no procedure creates them until a verified checkout exists.
    orders: router({
      list: protectedProcedure.query(async ({ ctx }) => (await listOrders(ctx.user.id)).map(toPublicRecord)),
    }),
    wardrobe: router({
      list: protectedProcedure.query(async ({ ctx }) => (await listWardrobeItems(ctx.user.id)).map(toPublicRecord)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
