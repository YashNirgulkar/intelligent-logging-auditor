import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { cn } from '../lib/utils';

interface Props {
  onScan: (url: string) => void;
  isLoading: boolean;
}

const sampleRepos = [
  { label: 'fastapi/fastapi', url: 'https://github.com/fastapi/fastapi' },
  { label: 'pallets/flask', url: 'https://github.com/pallets/flask' },
  { label: 'encode/httpx', url: 'https://github.com/encode/httpx' },
];

export const GitHubRepositoryForm: React.FC<Props> = ({ onScan, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const normalizeAndValidateUrl = (input: string): string | null => {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Enter a public GitHub repository URL.');
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const repository = parts[1]?.replace(/\.git$/i, '');
      if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
        setError('Use an HTTPS link from github.com.');
        return null;
      }
      if (parsed.username || parsed.password || parsed.search || parsed.hash || parts.length !== 2 || !parts[0] || !repository) {
        setError('Use the repository page URL: https://github.com/owner/repository');
        return null;
      }
      return `https://github.com/${parts[0]}/${repository}`;
    } catch {
      setError('That URL is not valid. Paste a link such as https://github.com/owner/repository.');
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const normalizedUrl = normalizeAndValidateUrl(url);
    if (normalizedUrl) onScan(normalizedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-2xl border border-[#e7e7e5] bg-white p-5 shadow-[0_2px_8px_rgba(24,24,22,0.035)] md:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f1ef] text-[#292928]">
            <GithubIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#20201f]">Public GitHub repository</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#62625f]">
              Paste a repository link. We’ll download its source archive and scan supported language files without executing them.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="github-repository-url" className="block text-xs font-semibold text-[#41413f]">
            Repository URL
          </label>
          <div className="relative">
            <GithubIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#70706d]" />
            <input
              id="github-repository-url"
              name="repositoryUrl"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoComplete="url"
              spellCheck={false}
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              placeholder="https://github.com/owner/repository"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'github-url-error' : 'github-url-help'}
              className={cn(
                'w-full rounded-xl border bg-[#fafaf9] py-3 pl-10 pr-4 font-mono text-sm text-[#20201f] outline-none transition focus:ring-2 focus:ring-[#292928]/10 disabled:cursor-wait disabled:opacity-60',
                error ? 'border-[#c51632] focus:border-[#c51632]' : 'border-[#e2e2df] focus:border-[#8a8a86]'
              )}
            />
          </div>
          <p id="github-url-help" className="text-[11px] text-[#70706d]">
            Public repositories only. The URL should end with the repository name.
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[#62625f]">
            <Sparkles className="h-3.5 w-3.5 text-[#555552]" /> Try a sample repository
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleRepos.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => {
                  setUrl(sample.url);
                  setError(null);
                }}
                disabled={isLoading}
                className="rounded-lg border border-[#e2e2df] bg-white px-3 py-1.5 font-mono text-[11px] text-[#555552] transition hover:border-[#c7c7c3] hover:bg-[#f5f5f4] disabled:opacity-50"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div id="github-url-error" role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-[#f0c9cf] bg-[#fff4f5] p-3 text-xs text-[#a51b31]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="btn-accent flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Fetching repository…</span>
            </>
          ) : (
            <>
              <span>Fetch and scan repository</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
