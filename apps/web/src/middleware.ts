import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedRoute = createRouteMatcher(['/apply(.*)', '/status(.*)', '/dashboard(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
    const { isAuthenticated, redirectToSignIn } = auth();

    if (!isAuthenticated && isProtectedRoute(context.request)) {
        return redirectToSignIn();
    }
});
