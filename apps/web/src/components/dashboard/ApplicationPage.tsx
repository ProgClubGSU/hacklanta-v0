import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import ApplicationForm, { type ApplicationData } from './ApplicationForm';
import ApplicationStatus from './ApplicationStatus';

export default function ApplicationPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        const token = await getToken();

        // First, sync the user from Clerk to the database (for local dev)
        // This ensures the user exists in the DB before fetching their application
        try {
          await apiFetch('/api/v1/users/sync', { method: 'POST' }, token);
        } catch (syncError) {
          console.warn('User sync failed (may already exist):', syncError);
        }

        // Now fetch their application
        const data = await apiFetch<ApplicationData>('/api/v1/applications/me', {}, token);
        setApplication(data);
      } catch {
        // 404 means no application yet — that's fine
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || loading) {
    return (
      <div className="mt-16 text-center">
        <span className="font-mono text-xs tracking-[0.3em] text-gray-500 uppercase">
          Loading...
        </span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mt-4 flex min-h-[calc(100vh-12rem)] flex-col">
        <div className="flex flex-1 flex-col border border-border bg-black">

          {/* Header strip — matches the form's betting slip header */}
          <div className="border-b border-border bg-black px-6 py-3.5 md:px-10">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.3em] text-gray-500 uppercase">
                HACKLANTA — APPLICATION
              </span>
              <span className="font-mono text-xs text-gold/60">♠ ♦ ♣ ♥</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 md:px-10">
            <div className="w-full max-w-sm text-center">

              <h1 className="mb-3 font-display text-4xl tracking-widest text-white">
                SIGN IN
              </h1>
              <div className="mx-auto mb-6 h-px w-10 bg-red/50" />
              <p className="mb-10 font-body text-base text-gray-dark">
                You need an account to apply for Hacklanta.
              </p>

              <div className="flex flex-col items-center gap-4">
                <a
                  href="/sign-in"
                  className="w-full border-2 border-red bg-red/10 px-8 py-3.5 font-display text-base tracking-widest text-red transition-all hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.22)] text-center"
                >
                  SIGN IN
                </a>
                <a
                  href="/sign-up"
                  className="w-full border border-border bg-black px-8 py-3.5 font-display text-base tracking-widest text-gray transition-all hover:border-border-light hover:text-white text-center"
                >
                  CREATE ACCOUNT
                </a>
              </div>

              {/* <p className="mt-8 font-mono text-xs text-gray-500">
                <a href="/" className="hover:text-white/50 transition-colors uppercase border border-border px-2 py-1">Home</a>
              </p> */}

            </div>
          </div>

          {/* Footer strip */}
          <div className="border-t border-border-light bg-black px-6 py-4 md:px-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-gray-500 text-center uppercase">
              progsu · Georgia State University
            </p>
          </div>

        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-8 max-w-md border border-suit-red/30 bg-suit-red/10 p-4 font-mono text-sm text-suit-red">
        {error}
      </div>
    );
  }

  if (application) {
    return <ApplicationStatus application={application} onUpdated={setApplication} />;
  }

  return <ApplicationForm onSubmitted={setApplication} />;
}
