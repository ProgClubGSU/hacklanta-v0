import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';

interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export default function UserGrid() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const result = await api.listUsers();
      setUsers(result.data ?? result);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="font-label text-sm uppercase tracking-widest text-outline">Loading teammates...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 font-headline text-2xl tracking-wide text-white-pure">No Players Available</h3>
        <p className="text-on-surface/60">No participant profiles are available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-red/20 pb-4">
        <h3 className="font-display text-xl tracking-wide text-white-pure">All Players</h3>
        <p className="mt-1 font-mono text-xs tracking-wider text-gray">
          {users.length} participant{users.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const displayName =
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.first_name || user.last_name || 'Anonymous Hacker';

          return (
            <div
              key={user.id}
              className="group relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-red/70 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)]"
            >
              <div
                className="pointer-events-none absolute right-2 top-2 select-none text-3xl text-red/10 transition-all group-hover:text-red/20"
                aria-hidden="true"
              >
                ♣
              </div>

              <div className="relative z-10 flex items-start gap-3">
                <img
                  src={user.avatar_url || 'https://via.placeholder.com/48'}
                  alt={displayName}
                  className="h-12 w-12 shrink-0 rounded-full border-2 border-red/30"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-white">{displayName}</h4>
                  <p className="truncate font-mono text-xs text-gray">{user.email}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
