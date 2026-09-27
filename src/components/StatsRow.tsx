import { Home, Trophy, TrendingDown } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";

type Verdict = ReturnType<typeof evaluateListing>;

function locality(listing: Listing): string {
  return listing.structured.normalized_locality ?? listing.structured.location ?? "Unconfirmed";
}

export function StatsRow({
  verdicts,
  listingsById,
}: {
  verdicts: Verdict[]; // already ranked best-first
  listingsById: Record<string, Listing>;
}) {
  if (verdicts.length === 0) return null;

  const top = verdicts[0];
  const bottom = verdicts[verdicts.length - 1];

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Home size={17} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Flats looked at</p>
          <p className="font-mono text-lg font-medium">{verdicts.length}</p>
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
          <Trophy size={17} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Highest ranked</p>
          <p className="truncate font-medium">
            {locality(listingsById[top.listingId])}{" "}
            <span className="font-mono text-xs text-muted">
              ({top.zeroDealbreakerCount}/3 clear)
            </span>
          </p>
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose">
          <TrendingDown size={17} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Lowest ranked</p>
          <p className="truncate font-medium">
            {locality(listingsById[bottom.listingId])}{" "}
            <span className="font-mono text-xs text-muted">
              ({bottom.zeroDealbreakerCount}/3 clear)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
