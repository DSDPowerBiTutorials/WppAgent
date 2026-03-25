import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import { authConfig } from "./auth.config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Authenticate via Supabase Auth
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.user) return null;

        // Fetch user profile from public.users
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, name, email, organization_id, role")
          .eq("auth_id", authData.user.id)
          .single();

        if (!dbUser) return null;

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          organizationId: dbUser.organization_id,
          role: dbUser.role,
        };
      },
    }),
  ],
});
