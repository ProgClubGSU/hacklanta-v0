import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
      setRequests(result.data);
    } catch (error) {
      console.error('Failed to load join requests:', error);
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
        <div className="text-center">
          <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-4 border-gold/20 border-t-gold"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded border border-gold/20 bg-gold/5 p-6 text-center">
        <p className="font-mono text-sm text-gold/80">No pending join requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 font-mono text-xs font-bold text-gold">
          {requests.length}
        </div>
        <h4 className="font-mono text-sm uppercase tracking-wider text-gold">
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
            className="rounded-lg border border-gold/40 bg-gold/5 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-start gap-3">
              <img
                src={request.user_avatar_url || 'https://via.placeholder.com/48'}
                alt={displayName}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-gold/30"
              />
              <div className="min-w-0 flex-1">
                <h5 className="font-medium text-white">{displayName}</h5>
                {request.user_email && (
                  <p className="truncate font-mono text-xs text-gray">{request.user_email}</p>
                )}
                <p className="mt-1 font-mono text-xs text-gold/70">
                  Requested {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {request.message && (
              <div className="mb-3 rounded border border-gold/20 bg-black/20 p-3">
                <p className="text-sm italic leading-relaxed text-white/80">
                  "{request.message}"
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={isProcessing}
                className="flex-1 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-green-500 transition-all hover:border-green-500/70 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={isProcessing}
                className="flex-1 rounded border border-red/40 bg-red/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : '✕ Reject'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
