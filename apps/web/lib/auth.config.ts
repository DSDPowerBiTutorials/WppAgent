import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (used by middleware).
 * Must NOT import @supabase/supabase-js or credential providers
 * as those require Node.js APIs unavailable in Edge runtime.
 *
 * Providers are added in auth-config.ts (server-only).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const, maxAge: 24 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }: any) {
      if (user) {
        token.userId = user.id;
        token.organizationId = (user as any).organizationId;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
