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

    const fetchApplication = async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<ApplicationData>('/api/v1/applications/me', {}, token);
        setApplication(data);
      } catch {
        // 404 means no application yet — that's fine
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || loading) {
    return (
      <div className="mt-12 text-center font-mono text-sm text-text-muted">
        // loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto mt-12 max-w-md text-center">
        <p className="font-mono text-sm text-text-muted">
          // you need to sign in before placing your bet
        </p>
        <a
          href="/sign-in"
          className="mt-4 inline-block border border-neon-green bg-neon-green/10 px-6 py-2 font-mono text-sm text-neon-green transition-all hover:bg-neon-green/20"
        >
          $ sign_in
        </a>
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
