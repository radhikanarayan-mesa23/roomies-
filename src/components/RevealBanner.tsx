import { PartyPopper, Sparkles } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";
import { FIELD_ICON, GapIcon } from "@/lib/dealbreakerIcons";

type Verdict = ReturnType<typeof evaluateListing>;

export function RevealBanner({
  listingsById,
  verdicts,
}: {
  listingsById: Record<string, Listing>;
  verdicts: Verdict[];
}) {
  if (verdicts.length === 0) return null;

  const finalizedVerdict = verdicts.find((v) => listingsById[v.listingId]?.is_finalized);
  if (finalizedVerdict) {
    return <DecidedBanner listing={listingsById[finalizedVerdict.listingId]} />;
  }

  const contender = verdicts[0];
  return <NotDecidedBanner listing={listingsById[contender.listingId]} verdict={contender} />;
}

function Feature({
  icon: Icon,
  label,
  value,
}: {
  icon: (typeof FIELD_ICON)[keyof typeof FIELD_ICON];
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/50 px-3 py-2">
      <Icon size={16} className="shrink-0 text-accent" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function DecidedBanner({ listing }: { listing: Listing }) {
  const s = listing.structured;
  return (
    <div className="glass-card card-ribbon relative mb-10 overflow-hidden p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-accent">
        <PartyPopper size={18} /> IT&rsquo;S OFFICIAL
      </div>
      <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {s.normalized_locality ?? s.location} is home! 🎉
      </h2>
      <p className="mt-2 text-sm text-muted">
        No more scrolling. No more WhatsApp essays. Pack your bags.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feature
          icon={FIELD_ICON.rent}
          label="Rent"
          value={s.monthly_rent != null ? `₹${s.monthly_rent.toLocaleString("en-IN")}/mo` : "Not confirmed"}
        />
        <Feature
          icon={FIELD_ICON.floor}
          label="Floor"
          value={s.floor_number != null ? `${s.floor_number} of ${s.total_floors ?? "?"}` : "Not confirmed"}
        />
        <Feature
          icon={FIELD_ICON.bathrooms}
          label="Bathrooms"
          value={s.bathrooms != null ? String(s.bathrooms) : "Not confirmed"}
        />
        <Feature
          icon={FIELD_ICON.lift}
          label="Lift"
          value={s.has_lift == null ? "Not confirmed" : s.has_lift ? "Yes" : "No"}
        />
        <Feature
          icon={FIELD_ICON.parking}
          label="Parking"
          value={s.has_parking == null ? "Not confirmed" : s.has_parking ? "Yes" : "No"}
        />
        <Feature
          icon={FIELD_ICON.petFriendly}
          label="Pet-friendly"
          value={s.pet_friendly == null ? "Not confirmed" : s.pet_friendly ? "Yes" : "No"}
        />
        <Feature
          icon={FIELD_ICON.bachelorFriendly}
          label="Bachelor-friendly"
          value={s.bachelor_friendly == null ? "Not confirmed" : s.bachelor_friendly ? "Yes" : "No"}
        />
        <Feature icon={FIELD_ICON.keyPlace} label="Furnishing" value={s.furnishing ?? "Not confirmed"} />
      </div>

      {listing.viewing_notes && (
        <p className="mt-4 text-sm text-muted">
          Viewing notes: <span className="text-foreground">{listing.viewing_notes}</span>
        </p>
      )}
      {listing.source_url && (
        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-accent underline underline-offset-4"
        >
          View original listing ↗
        </a>
      )}
    </div>
  );
}

function NotDecidedBanner({ listing, verdict }: { listing: Listing; verdict: Verdict }) {
  const s = listing.structured;
  const gaps = verdict.perPerson.flatMap((p) =>
    p.dealbreakerGaps.map((gap) => ({ person: p.participantName, gap }))
  );

  return (
    <div className="glass-card mb-10 p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted">
        <Sparkles size={16} /> NOT YOUR HOME... YET
      </div>
      <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
        The search continues 🕵️
      </h2>
      <p className="mt-2 text-sm text-muted">
        Closest frontrunner so far:{" "}
        <span className="font-medium text-foreground">
          {s.normalized_locality ?? s.location ?? "an unconfirmed locality"}
        </span>
        . Here&rsquo;s what&rsquo;s standing in the way:
      </p>

      {gaps.length === 0 ? (
        <p className="mt-4 text-sm text-emerald">
          Actually... nothing&rsquo;s blocking it. Someone just needs to hit &ldquo;Finalize&rdquo; below. 👀
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {gaps.map(({ person, gap }, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <GapIcon text={gap} className="mt-0.5 shrink-0 text-rose" />
              <span>
                <span className="font-medium">{person}:</span> {gap}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
