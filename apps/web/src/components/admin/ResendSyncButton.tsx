import { useState } from 'react';

interface SyncResult {
  audienceId?: string;
  total_in_db?: number;
  new_synced?: number;
  new_to_sync?: number;
  already_in_resend?: number;
  unsubscribed?: number;
  unsubscribed_skipped?: number;
  failed?: number;
  errors?: Array<{ email: string; error: string }>;
  dry_run?: boolean;
  error?: string;
}

export default function ResendSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync(dryRun = false) {
    setIsSyncing(true);
    setResult(null);

    try {
      const token = await window.Clerk?.session?.getToken();
      const res = await fetch(`/api/admin/sync-resend${dryRun ? '?dry_run=true' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Sync failed' });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white/80">
        Resend Audience Sync
      </h3>
      <p className="mt-2 text-sm text-white/50">
        Push all contacts from Supabase to your Resend audience for email campaigns.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleSync(false)}
          disabled={isSyncing}
          className="rounded border border-[#5865F2]/50 bg-[#5865F2]/20 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#5865F2]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync to Resend'}
        </button>
        <button
          type="button"
          onClick={() => handleSync(true)}
          disabled={isSyncing}
          className="rounded border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          Dry Run
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded border border-white/10 bg-black/30 p-4 font-mono text-xs text-white/70">
          {result.error ? (
            <p className="text-red-bright">{result.error}</p>
          ) : result.dry_run ? (
            <div className="space-y-1">
              <p>Total in DB: {result.total_in_db}</p>
              <p>Already in Resend: {result.already_in_resend}</p>
              <p>Unsubscribed (will skip): {result.unsubscribed}</p>
              <p className="text-white">New to sync: {result.new_to_sync}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p>New contacts synced: {result.new_synced}</p>
              <p>Already in Resend: {result.already_in_resend}</p>
              <p>Unsubscribed (skipped): {result.unsubscribed_skipped}</p>
              {(result.failed ?? 0) > 0 && <p className="text-red-bright">Failed: {result.failed}</p>}
              <p className="text-white/40">Audience ID: {result.audienceId}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
