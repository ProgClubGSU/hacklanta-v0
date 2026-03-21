import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { api } from '@/lib/api';
=======
import Icon from '@/components/ui/Icon';
>>>>>>> 054f02c (dashboard)

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
<<<<<<< HEAD
      const result = await api.listTeamJoinRequests(teamId);
      setRequests(result.data);
=======
      // TODO: Replace with real API call
      // const data = await api.listTeamJoinRequests(teamId, 'pending');
      // setRequests(data);
      setRequests([]); // No requests until API is connected
>>>>>>> 054f02c (dashboard)
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
<<<<<<< HEAD
      await api.updateJoinRequest(teamId, requestId, { status: 'approved' });
=======
      // TODO: Replace with real API call
      // await api.updateJoinRequest(teamId, requestId, { status: 'approved' });
      console.log('Approve request:', requestId);
>>>>>>> 054f02c (dashboard)
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
<<<<<<< HEAD
      await api.updateJoinRequest(teamId, requestId, { status: 'rejected' });
=======
      // TODO: Replace with real API call
      // await api.updateJoinRequest(teamId, requestId, { status: 'rejected' });
      console.log('Reject request:', requestId);
>>>>>>> 054f02c (dashboard)
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
          <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-4 border-secondary-fixed/20 border-t-secondary-fixed"></div>
          <p className="font-label text-xs uppercase tracking-widest text-outline">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded border border-secondary-container/20 bg-secondary-container/5 p-6 text-center">
        <Icon name="inbox" className="text-secondary-fixed/60" />
        <p className="font-label text-sm text-secondary-fixed/80">No pending join requests</p>
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
                <p className="text-sm italic leading-relaxed text-on-surface/80">
                  "{request.message}"
                </p>
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
