import { useState, useEffect, useRef } from 'react';
import { useClerk, useUser } from '@clerk/astro/react';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-icon-button flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/60 transition-all hover:border-red/50 hover:text-white/85 hover:shadow-[0_0_15px_rgba(196,30,58,0.2)]"
        aria-label="User menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-black border border-white/10 shadow-lg overflow-hidden z-50">
          {/* User info */}
          {user && (
            <div className="px-4 py-3 border-b border-white/10">
              <p className="font-mono text-[10px] tracking-wider uppercase text-[#4a4a4a] mb-1">
                Signed in as
              </p>
              <p className="font-body text-sm text-white/90 truncate">
                {user.primaryEmailAddress?.emailAddress || user.username}
              </p>
            </div>
          )}

          {/* Menu items */}
          <div className="py-2">
            <a
              href="/status"
              className="block px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
            >
              Application Status
            </a>
            <a
              href="/dashboard/team"
              className="block px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
            >
              Team Matcher
            </a>
            <a
              href="/dashboard"
              className="block px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
            >
              Dashboard
            </a>
          </div>

          {/* Sign out */}
          <div className="border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 font-mono text-xs uppercase tracking-wider text-red-bright hover:bg-red/10 transition-colors text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
