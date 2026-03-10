import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';
import type { MiddlewareHandler } from 'astro';

const isProtectedRoute = createRouteMatcher(['/apply(.*)', '/status(.*)']);

const hasValidClerkKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_');

export const onRequest: MiddlewareHandler = hasValidClerkKey
  ? clerkMiddleware((auth, context) => {
      const { isAuthenticated, redirectToSignIn } = auth();
      if (!isAuthenticated && isProtectedRoute(context.request)) {
        return redirectToSignIn();
      }
    })
  : ((_context, next) => next());
