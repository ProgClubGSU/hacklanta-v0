import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function TeamManager() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      const myTeam = await api.getMyTeam();
      setTeam(myTeam);
    } catch (err: any) {
      if (err.status !== 404) {
        setError('Failed to load team data.');
      } else {
        setTeam(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.createTeam({ name: createName, description: createDesc || null });
      await loadTeam();
    } catch (err: any) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.joinTeam({ invite_code: joinCode });
      await loadTeam();
    } catch (err: any) {
      setError(err.message || 'Failed to join team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.leaveTeam();
      setTeam(null);
    } catch (err: any) {
      setError(err.message || 'Failed to leave team.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse text-[#B92B27]">Loading team status...</div>;

  if (team) {
    const isLeader = team.members.some((m: any) => m.role === 'leader'); // Ideally check if *current user* is leader
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-['Leckerli_One'] text-white">{team.name}</h3>
            {team.description && <p className="text-gray-300 mt-2">{team.description}</p>}
          </div>
          <div className="bg-black/50 border border-[#B92B27]/50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Invite Code</div>
            <div className="text-xl font-mono text-[#FBAE17] select-all cursor-copy" title="Click to copy" onClick={() => navigator.clipboard.writeText(team.invite_code)}>
              {team.invite_code}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg text-[#B92B27] mb-3 border-b border-[#B92B27]/30 pb-2">
            Members ({team.members.length}/{team.max_size})
          </h4>
          <ul className="space-y-2">
            {team.members.map((member: any) => (
              <li key={member.id} className="flex items-center gap-3 bg-black/30 p-2 rounded">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs overflow-hidden">
                   {member.avatar_url ? <img src={member.avatar_url} alt="avatar" /> : '👤'}
                </div>
                <div>
                  <div className="text-white">User ID: {member.user_id.substring(0,8)}...</div>
                  <div className="text-xs text-gray-400 capitalize">{member.role}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded">{error}</div>}

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleLeave}
            disabled={actionLoading}
            className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Leaving...' : 'Leave Team'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
      
      {/* Create Team Form */}
      <div className="md:pr-8">
        <h3 className="text-xl text-white mb-4">Create a New Team</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <input
              type="text"
              required
              placeholder="Team Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
               className="w-full bg-black/40 border border-[#B92B27]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#B92B27] transition-colors"
            />
          </div>
          <div>
            <textarea
              placeholder="What is your team building? (Optional)"
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              className="w-full bg-black/40 border border-[#B92B27]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#B92B27] transition-colors resize-none h-20"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || !createName}
            className="w-full bg-[#B92B27] text-white hover:bg-[#B92B27]/80 font-['Leckerli_One'] px-6 py-2 rounded-md text-lg transition-all disabled:opacity-50"
          >
            Create Team
          </button>
        </form>
      </div>

      {/* Join Team Form */}
      <div className="pt-8 md:pt-0 md:pl-8">
        <h3 className="text-xl text-white mb-4">Join an Existing Team</h3>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
             <input
              type="text"
              required
              placeholder="6-character Invite Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full bg-black/40 border border-[#B92B27]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#B92B27] transition-colors font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || joinCode.length < 5}
            className="w-full bg-transparent border-2 border-[#B92B27] text-[#B92B27] hover:bg-[#B92B27] hover:text-white font-['Leckerli_One'] px-6 py-2 rounded-md text-lg transition-all disabled:opacity-50"
          >
            Join Team
          </button>
        </form>
      </div>
      
      {error && <div className="col-span-full mt-4 text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded">{error}</div>}
    </div>
  );
}
