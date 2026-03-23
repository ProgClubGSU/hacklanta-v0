import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import CasinoSpinner from './casino/CasinoSpinner';

interface JoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  message: string | null;
  expires_at: string;
  created_at: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_avatar_url: string | null;
  user_email: string | null;
}

interface JoinRequestManagerProps {
  teamId: string;
  onRequestProcessed: () => void;
}

export default function JoinRequestManager({ teamId, onRequestProcessed }: JoinRequestManagerProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [teamId]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const result = await api.listTeamJoinRequests(teamId);
      setRequests(result.data ?? []);
    } catch (error) {
      console.error('Failed to load join requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await api.updateJoinRequest(teamId, requestId, { status: 'approved' });
      onRequestProcessed();
      await loadRequests();
    } catch (error: unknown) {
      console.error('Failed to approve request:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await api.updateJoinRequest(teamId, requestId, { status: 'rejected' });
      await loadRequests();
    } catch (error: unknown) {
      console.error('Failed to reject request:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3 text-center">
          <CasinoSpinner variant="chip-flip" size={24} color="gold" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
            Reading the table...
          </p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-6">
        {/* Diagonal stripe pattern (subtle) */}
        <div className="pointer-events-none absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(201,168,76,0.1) 10px, rgba(201,168,76,0.1) 20px)'
        }} />

        <div className="relative z-10">
          {/* Section label */}
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9A84C]/40">
            [00]
          </div>

          {/* Header with icon */}
          <div className="mb-2 flex items-center gap-3">
            <Icon name="inbox" className="text-[#C9A84C]/60 text-2xl" />
            <h4 className="font-mono text-sm uppercase tracking-[0.15em] text-[#C9A84C]">
              DEALER'S TRAY: EMPTY
            </h4>
          </div>

          {/* Description */}
          <p className="font-body text-xs leading-relaxed text-white/55">
            No players waiting to join your table. Share your invite code to fill the seats.
          </p>

          {/* Decorative card suits */}
          <div className="mt-4 flex justify-end gap-2 text-base">
            <span className="text-[#C9A84C]/20">♦</span>
            <span className="text-white/15">♣</span>
            <span className="text-[#C9A84C]/20">♥</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container/20 font-mono text-xs font-bold text-secondary-fixed">
          {requests.length}
        </div>
        <h4 className="font-label text-sm uppercase tracking-wider text-secondary-fixed">
          Pending Join Requests
        </h4>
      </div>

      {requests.map((request) => {
        const displayName =
          request.user_first_name && request.user_last_name
            ? `${request.user_first_name} ${request.user_last_name}`
            : request.user_first_name || request.user_last_name || 'Anonymous Hacker';

        const isProcessing = processingId === request.id;

        return (
          <div
            key={request.id}
            className="rounded-lg border border-secondary-container/40 bg-secondary-container/5 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-start gap-3">
              <img
                src={request.user_avatar_url || 'https://via.placeholder.com/48'}
                alt={displayName}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-secondary-fixed/30"
              />
              <div className="min-w-0 flex-1">
                <h5 className="font-medium text-white">{displayName}</h5>
                {request.user_email && (
                  <p className="truncate font-mono text-xs text-on-surface/60">{request.user_email}</p>
                )}
                <p className="mt-1 flex items-center gap-1 font-label text-xs text-secondary-fixed/70">
                  <Icon name="schedule" className="text-xs" />
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {request.message && (
              <div className="mb-3 rounded border border-outline-variant/20 bg-surface-container-highest/30 p-3">
                <p className="text-sm italic leading-relaxed text-on-surface/80">"{request.message}"</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={isProcessing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 font-label text-xs font-semibold uppercase tracking-wider text-green-500 transition-all hover:border-green-500/70 hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="check_circle" className="text-sm" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={isProcessing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded border border-error/40 bg-error-container/10 px-4 py-2 font-label text-xs font-semibold uppercase tracking-wider text-error transition-all hover:border-error/70 hover:bg-error-container/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="cancel" className="text-sm" />
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
