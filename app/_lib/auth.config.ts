import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard =
        nextUrl.pathname === "/home" || nextUrl.pathname.startsWith("/board");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/home", nextUrl));
      }
      return true;
    },
    async session({ session, user, token }) {
      session.user!.id = token.sub!;
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
};
