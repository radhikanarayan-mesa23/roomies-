"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Listing } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";

type Verdict = ReturnType<typeof evaluateListing>;

function fitBadge(zeroCount: number) {
  if (zeroCount === 3) return { text: "Works for all 3", cls: "bg-emerald/15 text-emerald" };
  if (zeroCount === 2) return { text: "Works for 2 of 3", cls: "bg-amber/15 text-amber" };
  if (zeroCount === 1) return { text: "Works for 1 of 3", cls: "bg-rose/15 text-rose" };
  return { text: "Works for none yet", cls: "bg-rose/15 text-rose" };
}

function ScoreNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: value,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = obj.v.toFixed(1);
      },
    });
  }, [value]);

  return <span ref={ref}>0.0</span>;
}

export function ListingCard({
  listing,
  verdict,
  large,
}: {
  listing: Listing;
  verdict: Verdict;
  large?: boolean;
}) {
  const s = listing.structured;
  const badge = fitBadge(verdict.zeroDealbreakerCount);

  return (
    <div
      className={`listing-card glass-card p-5 ${large ? "sm:p-6" : ""}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-semibold tracking-tight ${large ? "text-lg" : "text-base"}`}>
            {s.normalized_locality ?? s.location ?? "Locality not confirmed"}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {s.monthly_rent != null ? `₹${s.monthly_rent.toLocaleString("en-IN")}/mo` : "Rent not confirmed"}
            {s.floor_number != null ? ` · Floor ${s.floor_number}` : ""}
            <span className="ml-1.5 text-xs">(equal 3-way split)</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <SourceBadge listing={listing} />

      <div className="mt-4 space-y-3 divide-y divide-border">
        {verdict.perPerson.map((p) => (
          <div key={p.participantId} className="pt-3 first:pt-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-16 shrink-0 font-medium">{p.participantName}</span>
              <span className="w-10 shrink-0 text-muted">
                {p.score != null ? (
                  <>
                    <ScoreNumber value={p.score} />/5
                  </>
                ) : (
                  "—"
                )}
              </span>
              {p.dealbreakerGaps.length === 0 ? (
                <span className="text-emerald">✅ Works — every preference met</span>
              ) : (
                <span className="text-rose">❌ {p.dealbreakerGaps[0]}</span>
              )}
            </div>
            {p.dealbreakerGaps.length > 1 && (
              <ul className="mt-1 space-y-0.5 pl-[4.7rem] text-sm text-rose">
                {p.dealbreakerGaps.slice(1).map((g, i) => (
                  <li key={i}>❌ {g}</li>
                ))}
              </ul>
            )}
            {p.givesUp.length > 0 && (
              <p className="mt-1 pl-[4.7rem] text-sm text-amber">
                ⚠️ Gives up: {p.givesUp.map((g) => `${g.label} (${g.weight})`).join(", ")}
              </p>
            )}
            {p.notConfirmed.length > 0 && (
              <p className="mt-1 pl-[4.7rem] text-sm text-zinc">
                ◌ Not confirmed: {p.notConfirmed.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceBadge({ listing }: { listing: Listing }) {
  const label = listing.source_channel === "telegram" ? "Telegram" : "Web";
  if (listing.source_url) {
    return (
      <a
        href={listing.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs text-muted hover:border-accent/50 hover:text-accent"
      >
        {label} · source ↗
      </a>
    );
  }
  return (
    <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
      {label}
    </span>
  );
}
