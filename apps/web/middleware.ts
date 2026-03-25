import { auth } from "./lib/auth-config";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isLoginPage = nextUrl.pathname === "/login";

  // If on login page and already logged in, redirect to dashboard
  if (isLoginPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // If not logged in and not on login page, redirect to login
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: [
    /*
     * Protect all dashboard and app routes.
     * Exclude: static files, images, favicon, API routes (auth checked in handlers),
     * landing page (/), and public assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
