import { useState } from 'react';

interface DiscordCopyProps {
  username: string;
  size?: 'sm' | 'md';
}

export default function DiscordCopy({ username, size = 'md' }: DiscordCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(username);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isMd = size === 'md';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group/dc inline-flex items-center gap-1.5 rounded transition-colors ${
        isMd ? 'px-1 py-0.5 -mx-1' : 'px-0.5 py-0.5 -mx-0.5'
      } hover:bg-[#5865F2]/10`}
      title="Click to copy Discord username"
    >
      <span className={`font-semibold ${isMd ? 'text-white' : 'text-white/80 text-xs'}`}>
        {username}
      </span>
      <span
        className={`inline-flex items-center transition-all ${
          copied
            ? 'opacity-100'
            : 'opacity-0 group-hover/dc:opacity-60'
        } ${isMd ? 'text-sm' : 'text-xs'}`}
      >
        {copied ? (
          <svg className={`${isMd ? 'h-4 w-4' : 'h-3 w-3'} text-[#00ff88]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className={`${isMd ? 'h-4 w-4' : 'h-3 w-3'} text-white/40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </span>
      {copied && (
        <span className={`font-mono uppercase tracking-wider text-[#00ff88] ${isMd ? 'text-[9px]' : 'text-[8px]'}`}>
          Copied
        </span>
      )}
    </button>
  );
}
