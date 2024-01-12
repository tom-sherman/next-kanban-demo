import "server-only";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { email, safeParse, object, string, minLength } from "valibot";
import { getAccountWithPassword } from "./db";
import crypto from "node:crypto";

export { AuthError } from "next-auth";

export const {
  signIn,
  signOut,
  auth,
  update: updateSession,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(inputCredentials) {
        const parsedCredentials = safeParse(
          object({
            email: string([email()]),
            password: string([minLength(6)]),
          }),
          inputCredentials
        );

        if (!parsedCredentials.success) return null;

        const credentials = parsedCredentials.output;
        const account = await getAccountWithPassword(credentials.email);
        if (!account) return null;
        // TODO: This feels part of the data layer. Move it to db.ts
        const hash = crypto
          .pbkdf2Sync(
            credentials.password,
            account.passwordSalt,
            1000,
            64,
            "sha256"
          )
          .toString("hex");

        if (hash !== account.passwordHash) return null;

        return {
          email: account.email,
          id: account.id,
          name: "hello????",
        };
      },
    }),
  ],
});

export async function isLoggedIn() {
  return !!(await getCurrentUserId());
}

export async function getCurrentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}
