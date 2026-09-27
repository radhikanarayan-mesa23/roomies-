"use client";

import { useRef, useState, useTransition } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ThumbsUp, CalendarPlus, Check } from "lucide-react";
import type { Listing } from "@/lib/types";
import type { evaluateListing } from "@/lib/matching";
import { Avatar } from "./Avatar";
import { GapIcon, WORKS_ICON, NOT_CONFIRMED_ICON, GIVES_UP_ICON } from "@/lib/dealbreakerIcons";
import { toggleInterest, updateViewingNotes } from "@/app/dashboard/actions";

type Verdict = ReturnType<typeof evaluateListing>;

function fitBadge(zeroCount: number) {
  if (zeroCount === 3) return { text: "✨ Works for all 3", cls: "badge-gradient" };
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
      className={`listing-card glass-card group p-5 transition-transform hover:-translate-y-1 ${large ? "card-ribbon sm:p-6" : ""}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3
            className={`font-display font-medium tracking-tight ${large ? "text-xl" : "text-lg"}`}
          >
            {s.normalized_locality ?? s.location ?? "Locality not confirmed"}
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            <span className="font-mono">
              {s.monthly_rent != null ? `₹${s.monthly_rent.toLocaleString("en-IN")}/mo` : "Rent not confirmed"}
            </span>
            {s.floor_number != null ? ` · Floor ${s.floor_number}` : ""}
            <span className="ml-1.5 text-xs">(equal 3-way split)</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <SourceBadge listing={listing} />

      <div className="mt-4 space-y-1 divide-y divide-border">
        {verdict.perPerson.map((p) => (
          <div
            key={p.participantId}
            className="-mx-2 rounded-xl px-2 py-3 transition-colors first:pt-2 hover:bg-white/50"
          >
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={p.participantName} />
              <span className="w-14 shrink-0 font-medium">{p.participantName}</span>
              <span className="w-10 shrink-0 font-mono text-muted">
                {p.score != null ? (
                  <>
                    <ScoreNumber value={p.score} />/5
                  </>
                ) : (
                  "—"
                )}
              </span>
              {p.dealbreakerGaps.length === 0 ? (
                <span className="flex items-center gap-1.5 text-emerald">
                  <WORKS_ICON size={15} className="shrink-0" /> Works — every preference met
                </span>
              ) : (
                <GapLine text={p.dealbreakerGaps[0]} />
              )}
            </div>
            {p.dealbreakerGaps.length > 1 && (
              <ul className="mt-1.5 space-y-1 pl-[4.7rem]">
                {p.dealbreakerGaps.slice(1).map((g, i) => (
                  <li key={i}>
                    <GapLine text={g} />
                  </li>
                ))}
              </ul>
            )}
            {p.givesUp.length > 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 pl-[4.7rem] text-sm text-amber">
                <GIVES_UP_ICON size={14} className="mt-0.5 shrink-0" />
                Gives up: {p.givesUp.map((g) => `${g.label} (${g.weight})`).join(", ")}
              </p>
            )}
            {p.notConfirmed.length > 0 && (
              <p className="mt-1.5 flex items-start gap-1.5 pl-[4.7rem] text-sm text-zinc">
                <NOT_CONFIRMED_ICON size={14} className="mt-0.5 shrink-0" />
                Not confirmed: {p.notConfirmed.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <InterestRow listing={listing} verdict={verdict} />
      <ViewingNotes listing={listing} />
    </div>
  );
}

function InterestRow({ listing, verdict }: { listing: Listing; verdict: Verdict }) {
  const [interested, setInterested] = useState(listing.interested_by);
  const [, startTransition] = useTransition();

  function toggle(participantId: string) {
    setInterested((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId]
    );
    startTransition(() => {
      toggleInterest(listing.id, participantId);
    });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
      <span className="mr-1 text-xs text-muted">Interested:</span>
      {verdict.perPerson.map((p) => {
        const isIn = interested.includes(p.participantId);
        return (
          <button
            key={p.participantId}
            type="button"
            onClick={() => toggle(p.participantId)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all hover:scale-105 ${
              isIn ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-border text-muted"
            }`}
          >
            <ThumbsUp size={12} className={isIn ? "fill-current" : ""} />
            {p.participantName}
          </button>
        );
      })}
    </div>
  );
}

function ViewingNotes({ listing }: { listing: Listing }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(listing.viewing_notes ?? "");
  const [saved, setSaved] = useState(listing.viewing_notes ?? "");
  const [, startTransition] = useTransition();

  function save() {
    setSaved(value);
    setEditing(false);
    startTransition(() => {
      updateViewingNotes(listing.id, value);
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 flex w-full items-center gap-1.5 text-left text-xs text-muted hover:text-accent"
      >
        <CalendarPlus size={13} />
        {saved ? (
          <span>
            Viewing: <span className="text-foreground">{saved}</span>
          </span>
        ) : (
          "+ Add viewing dates"
        )}
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <CalendarPlus size={13} className="shrink-0 text-muted" />
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="e.g. Sat 2-4pm"
        className="input py-1 text-xs"
      />
      <button type="button" onClick={save} className="shrink-0 text-emerald">
        <Check size={16} />
      </button>
    </div>
  );
}

function GapLine({ text }: { text: string }) {
  return (
    <span className="flex items-start gap-1.5 text-sm text-rose">
      <GapIcon text={text} className="mt-0.5 shrink-0" />
      {text}
    </span>
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
