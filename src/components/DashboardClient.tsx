"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Listing, Participant } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";
import { ListingCard } from "./ListingCard";

type Verdict = ReturnType<typeof evaluateListing>;

export function AvatarChips({ participants }: { participants: Participant[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {participants.map((p) => (
        <span
          key={p.id}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
            p.form_submitted_at
              ? "border-emerald/30 bg-emerald/10 text-emerald"
              : "border-border text-muted"
          }`}
        >
          {p.form_submitted_at ? "✓" : "…"} {p.name}
        </span>
      ))}
    </div>
  );
}

export function WaitingState({ waitingOn }: { waitingOn: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold">Waiting on {waitingOn.join(", ")}</h2>
      <p className="mt-2 text-sm text-muted">
        Verdicts show up once all three forms are in — partial data would just be
        misleading.
      </p>
    </div>
  );
}

export function AnimatedGrid({
  shortlistIds,
  verdicts,
  listingsById,
}: {
  shortlistIds: string[];
  verdicts: Verdict[];
  listingsById: Record<string, Listing>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = containerRef.current?.querySelectorAll(".listing-card");
      if (!cards?.length) return;
      gsap.fromTo(
        cards,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    },
    { scope: containerRef }
  );

  const shortlistSet = new Set(shortlistIds);
  const shortlisted = verdicts.filter((v) => shortlistSet.has(v.listingId));
  const others = verdicts.filter((v) => !shortlistSet.has(v.listingId));

  if (verdicts.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h2 className="text-lg font-semibold">No listings yet</h2>
        <p className="mt-2 text-sm text-muted">
          Share one to the Telegram bot or the /add page to get started.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-12">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Shortlist
        </h2>
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
            Nothing works for at least 2 people yet — check the gaps below and see what
            you might adjust.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shortlisted.map((v) => (
              <ListingCard key={v.listingId} listing={listingsById[v.listingId]} verdict={v} large />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          All listings
        </h2>
        {others.length === 0 ? (
          <p className="text-sm text-muted">Nothing else to show.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((v) => (
              <ListingCard key={v.listingId} listing={listingsById[v.listingId]} verdict={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
