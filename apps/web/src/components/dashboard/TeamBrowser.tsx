import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function TeamBrowser() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const data = await api.listProfiles();
        setProfiles(data);
      } catch (err: any) {
        setError('Failed to load hacker directory.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  if (loading) return <div className="text-center py-12 text-[#FBAE17] animate-pulse">Loading directory...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;
  if (profiles.length === 0) return <div className="text-center py-12 text-gray-400">No hackers found looking for a team right now. Be the first to create your profile!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {profiles.map((profile) => (
        <div key={profile.id} className="bg-[#1A0033]/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-[#FBAE17]/50 transition-colors">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center overflow-hidden border border-[#FBAE17]/30">
              <span className="text-2xl">👨‍💻</span>
            </div>
            <div>
              <h3 className="text-xl font-['Leckerli_One'] text-white">{profile.display_name}</h3>
               {/* 
                 Currently missing avatar fetching from Clerk directly in backend, 
                 but could be added. So we use an emoji placeholder for now.
               */}
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mb-6 h-20 overflow-y-auto pr-2 custom-scrollbar">
            {profile.bio || "No bio provided."}
          </p>
          
          <div className="flex gap-3 pt-4 border-t border-white/10">
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="GitHub">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0a66c2] transition-colors" title="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
              </a>
            )}
            {profile.portfolio_url && (
               <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FBAE17] transition-colors" title="Portfolio">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
