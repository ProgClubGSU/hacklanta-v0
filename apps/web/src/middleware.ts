// ── Clerk middleware temporarily disabled (no keys set) ──────────────────────
// Restore this block once PUBLIC_CLERK_PUBLISHABLE_KEY & CLERK_SECRET_KEY
// are set in apps/web/.env from https://dashboard.clerk.com/last-active?path=api-keys
//
// import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';
//
// const isProtectedRoute = createRouteMatcher(['/apply(.*)', '/status(.*)']);
//
// export const onRequest = clerkMiddleware((auth, context) => {
//   const { isAuthenticated, redirectToSignIn } = auth();
//   if (!isAuthenticated && isProtectedRoute(context.request)) {
//     return redirectToSignIn();
//   }
// });

import type { MiddlewareHandler } from 'astro';
export const onRequest: MiddlewareHandler = (_, next) => next();
