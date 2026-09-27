"use client";

import { useState } from "react";
import { confirmListing, previewListing } from "./actions";
import type { Participant, StructuredListing } from "@/lib/types";

type Stage =
  | { step: "input" }
  | { step: "duplicate" }
  | { step: "preview"; structured: StructuredListing; missingFields: string[] }
  | { step: "saved" };

export function AddClient({ participants }: { participants: Participant[] }) {
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submittedBy, setSubmittedBy] = useState(participants[0]?.id ?? "");
  const [stage, setStage] = useState<Stage>({ step: "input" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await previewListing(rawText);
      if (result.duplicate) setStage({ step: "duplicate" });
      else setStage({ step: "preview", structured: result.structured, missingFields: result.missingFields });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    }
    setLoading(false);
  }

  async function handleConfirm() {
    if (stage.step !== "preview") return;
    setLoading(true);
    setError(null);
    const result = await confirmListing({
      rawText,
      sourceUrl: sourceUrl.trim() || null,
      submittedBy,
      structured: stage.structured,
    });
    setLoading(false);
    if (result.ok) setStage({ step: "saved" });
    else setError(result.error);
  }

  if (stage.step === "saved") {
    return (
      <div className="glass-card p-8 text-center">
        <h1 className="font-display text-xl font-medium">Saved ✓</h1>
        <p className="mt-2 text-sm text-muted">
          It&apos;ll show up on the{" "}
          <a href="/dashboard" className="text-accent underline underline-offset-4">
            dashboard
          </a>{" "}
          now.
        </p>
        <button
          onClick={() => {
            setRawText("");
            setSourceUrl("");
            setStage({ step: "input" });
          }}
          className="btn-secondary mt-6"
        >
          Add another
        </button>
      </div>
    );
  }

  if (stage.step === "duplicate") {
    return (
      <div className="glass-card p-8 text-center">
        <h1 className="font-display text-xl font-medium">Already added</h1>
        <p className="mt-2 text-sm text-muted">
          This exact listing text is already on the dashboard.
        </p>
        <button onClick={() => setStage({ step: "input" })} className="btn-secondary mt-6">
          Try a different listing
        </button>
      </div>
    );
  }

  if (stage.step === "preview") {
    const s = stage.structured;
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-medium">Review before saving</h1>
        <div className="glass-card p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <PreviewField label="Locality" value={s.normalized_locality} missing={stage.missingFields.includes("normalized locality")} />
            <PreviewField label="Rent" value={s.monthly_rent ? `₹${s.monthly_rent}` : null} missing={stage.missingFields.includes("monthly rent")} />
            <PreviewField label="Floor" value={s.floor_number != null ? `${s.floor_number} of ${s.total_floors ?? "?"}` : null} missing={stage.missingFields.includes("floor number")} />
            <PreviewField label="Bathrooms" value={s.bathrooms?.toString() ?? null} missing={stage.missingFields.includes("bathrooms")} />
            <PreviewField label="Lift" value={s.has_lift == null ? null : s.has_lift ? "Yes" : "No"} missing={stage.missingFields.includes("has lift")} />
            <PreviewField label="Parking" value={s.has_parking == null ? null : s.has_parking ? "Yes" : "No"} missing={stage.missingFields.includes("has parking")} />
            <PreviewField label="Pet-friendly" value={s.pet_friendly == null ? null : s.pet_friendly ? "Yes" : "No"} missing={stage.missingFields.includes("pet friendly")} />
            <PreviewField label="Bachelor-friendly" value={s.bachelor_friendly == null ? null : s.bachelor_friendly ? "Yes" : "No"} missing={stage.missingFields.includes("bachelor friendly")} />
          </dl>
          {s.other_notes && <p className="mt-4 text-sm text-muted">Notes: {s.other_notes}</p>}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Who&apos;s submitting?</span>
          <select value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} className="input">
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-rose">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => setStage({ step: "input" })} className="btn-secondary">
            Back
          </button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
            {loading ? "Saving…" : "Confirm & save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleExtract} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Add a listing</h1>
        <p className="mt-1 text-sm text-muted">
          Paste the listing text. Gemini extracts the facts — nothing is guessed.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Listing text</span>
        <textarea
          required
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="input"
          placeholder="Paste the full listing message here…"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">
          Source URL (optional)
        </span>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="input"
          placeholder="https://nobroker.in/…"
        />
      </label>

      {error && <p className="text-sm text-rose">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Extracting…" : "Extract details"}
      </button>
    </form>
  );
}

function PreviewField({
  label,
  value,
  missing,
}: {
  label: string;
  value: string | null;
  missing: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={missing ? "text-amber" : ""}>{value ?? "◌ Not confirmed"}</dd>
    </div>
  );
}
