import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";
import { checkLoginRateLimit, recordLoginAttempt } from "./rate-limit";

// ---------------------------------------------------------------
// Auth strategy:
// - Google OAuth via NextAuth's built-in, audited provider (no
//   hand-rolled OAuth code — that's how OAuth bugs happen).
// - Email/password via Credentials provider, bcrypt-hashed,
//   rate-limited per email+IP to blunt brute force.
// - JWT sessions (stateless, httpOnly, secure cookies set by
//   NextAuth) with a short-ish max age and rotation.
// ---------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax", // CSRF mitigation: cross-site requests won't carry the cookie
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip =
          (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          "unknown";

        const { allowed } = await checkLoginRateLimit(parsed.data.email, ip);
        if (!allowed) {
          // Thrown message surfaces to the client via the error query param
          throw new Error("TooManyAttempts");
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        // Constant-shape response whether the user exists or not,
        // and whether or not they have a password set (OAuth-only
        // accounts have passwordHash = null) — avoids user enumeration.
        const hash = user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsa";
        const valid = await bcrypt.compare(parsed.data.password, hash);
        const success = Boolean(user?.passwordHash) && valid;

        await recordLoginAttempt({
          userId: user?.id,
          email: parsed.data.email.toLowerCase(),
          ipAddress: ip,
          success,
        });

        if (!success || !user) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
