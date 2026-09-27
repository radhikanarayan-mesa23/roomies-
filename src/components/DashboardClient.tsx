"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Listing, Participant } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";
import { ListingCard } from "./ListingCard";

type Verdict = ReturnType<typeof evaluateListing>;

export function ReadinessProgress({ participants }: { participants: Participant[] }) {
  const submittedCount = participants.filter((p) => p.form_submitted_at).length;
  const pct = (submittedCount / participants.length) * 100;
  const fillRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!fillRef.current) return;
    gsap.fromTo(
      fillRef.current,
      { width: "0%" },
      { width: `${pct}%`, duration: 0.8, ease: "power2.out" }
    );
  }, [pct]);

  const copy =
    submittedCount === participants.length
      ? "Everyone's in — verdicts below 🎉"
      : submittedCount === 0
        ? "Waiting on everyone to spill their dealbreakers"
        : `${submittedCount} of ${participants.length} in — nearly there`;

  return (
    <div className="w-full sm:w-72">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{copy}</p>
        <div className="flex flex-wrap gap-1.5">
          {participants.map((p) => (
            <span
              key={p.id}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${
                p.form_submitted_at
                  ? "border-emerald/30 bg-emerald/10 text-emerald"
                  : "border-border text-muted"
              }`}
            >
              {p.form_submitted_at ? "✓" : "…"} {p.name}
            </span>
          ))}
        </div>
      </div>
      <div className="progress-track">
        <div ref={fillRef} className="progress-fill" style={{ width: "0%" }} />
      </div>
    </div>
  );
}

export function WaitingState({ waitingOn }: { waitingOn: string[] }) {
  return (
    <div className="glass-card p-10 text-center">
      <p className="text-3xl">⏳</p>
      <h2 className="mt-3 font-display text-xl font-medium">
        Hang tight — waiting on {waitingOn.join(", ")}
      </h2>
      <p className="mt-2 text-sm text-muted">
        Verdicts show up the moment all three forms are in. Partial data would just be
        misleading — no shortcuts here.
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
      <div className="glass-card p-10 text-center">
        <p className="text-3xl">🔍</p>
        <h2 className="mt-3 font-display text-xl font-medium">Nothing shared yet</h2>
        <p className="mt-2 text-sm text-muted">
          Paste a listing to the Telegram bot or hit <code className="text-accent">/add</code>{" "}
          to get the ball rolling.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-12">
      <section>
        <h2 className="font-display text-2xl font-medium">✨ The shortlist</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Top picks where at least 2 of you have zero dealbreakers.
        </p>
        {shortlisted.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-muted">
            😅 Nothing clicks for 2+ people yet — that&rsquo;s useful info too. See what
            gaps show up below and decide whether to adjust.
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
        <h2 className="font-display text-2xl font-medium">Everything else</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Every other listing, same full breakdown.</p>
        {others.length === 0 ? (
          <p className="text-sm text-muted">Nothing else to show — the shortlist has it all.</p>
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
