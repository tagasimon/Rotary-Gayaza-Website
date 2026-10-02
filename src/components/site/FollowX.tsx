/**
 * Social feed slot. X's API is paid and its embeds are unreliable, so V1 shows a clean follow card.
 * To add a feed later, implement a provider that returns SocialPost[] (e.g. from an approved
 * "Discovered online" item, or a paid API) and render it here — the site never depends on it.
 */
export type SocialPost = { id: string; text: string; url: string; date: Date; imageUrl?: string };

export function FollowX({ handle = "Rcgayaza", url = "https://x.com/Rcgayaza", posts = [] as SocialPost[] }) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 border-y border-line py-8 sm:flex-row sm:items-center">
      <div>
        <p className="eyebrow text-soil">Between Sundays</p>
        <p className="display mt-2 text-3xl text-ink">Follow the club on X <span className="text-royal">@{handle}</span></p>
        <p className="mt-1 text-ink-2">Meeting notes, service days and photographs as they happen.</p>
      </div>
      {posts.length === 0 && <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-royal">Follow @{handle} ↗</a>}
    </div>
  );
}
