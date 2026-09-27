"use client";

import { useState } from "react";
import { submitForm } from "./actions";

const PREDEFINED_PREFS = [
  "Furnished",
  "Balcony",
  "Natural light",
  "Society amenities",
  "Quiet locality",
  "Near public transport",
  "Vastu",
  "Water supply",
];

type KeyPlace = { name: string; maxKm: string };
type ExistingPrefs = {
  max_rent: number | null;
  no_go_areas: string[];
  min_bathrooms: number | null;
  max_floor: number | null;
  requires_lift: boolean;
  requires_parking: boolean;
  requires_pet_friendly: boolean;
  requires_bachelor_friendly: boolean;
  key_places: { name: string; max_km: number }[];
  soft_preferences: { label: string; weight: number; is_custom: boolean }[];
} | null;

export function FormClient({
  token,
  name,
  alreadySubmitted,
  existingPrefs,
}: {
  token: string;
  name: string;
  alreadySubmitted: boolean;
  existingPrefs: ExistingPrefs;
}) {
  const [maxRent, setMaxRent] = useState(existingPrefs?.max_rent?.toString() ?? "");
  const [noGoAreas, setNoGoAreas] = useState<string[]>(existingPrefs?.no_go_areas ?? []);
  const [noGoInput, setNoGoInput] = useState("");
  const [minBathrooms, setMinBathrooms] = useState(
    existingPrefs?.min_bathrooms?.toString() ?? "1"
  );
  const [maxFloor, setMaxFloor] = useState(existingPrefs?.max_floor?.toString() ?? "");
  const [requiresLift, setRequiresLift] = useState(existingPrefs?.requires_lift ?? false);
  const [requiresParking, setRequiresParking] = useState(
    existingPrefs?.requires_parking ?? false
  );
  const [requiresPetFriendly, setRequiresPetFriendly] = useState(
    existingPrefs?.requires_pet_friendly ?? false
  );
  const [requiresBachelorFriendly, setRequiresBachelorFriendly] = useState(
    existingPrefs?.requires_bachelor_friendly ?? false
  );
  const [keyPlaces, setKeyPlaces] = useState<KeyPlace[]>(
    existingPrefs?.key_places?.length
      ? existingPrefs.key_places.map((k) => ({ name: k.name, maxKm: k.max_km.toString() }))
      : [{ name: "", maxKm: "" }]
  );

  const initialWeights: Record<string, number> = {};
  for (const p of existingPrefs?.soft_preferences ?? []) {
    if (!p.is_custom) initialWeights[p.label] = p.weight;
  }
  const [weights, setWeights] = useState<Record<string, number>>(initialWeights);
  const existingCustom = existingPrefs?.soft_preferences?.find((p) => p.is_custom);
  const [customLabel, setCustomLabel] = useState(existingCustom?.label ?? "");
  const [customWeight, setCustomWeight] = useState(existingCustom?.weight ?? 0);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);

  function addNoGo() {
    const v = noGoInput.trim();
    if (v && !noGoAreas.includes(v)) setNoGoAreas([...noGoAreas, v]);
    setNoGoInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const softPreferences = [
      ...PREDEFINED_PREFS.filter((label) => (weights[label] ?? 0) > 0).map((label) => ({
        label,
        weight: weights[label],
        is_custom: false,
      })),
      ...(customLabel.trim() && customWeight > 0
        ? [{ label: customLabel.trim(), weight: customWeight, is_custom: true }]
        : []),
    ];

    const result = await submitForm(token, {
      maxRent: Number(maxRent) || 0,
      noGoAreas,
      minBathrooms: Number(minBathrooms) || 0,
      maxFloor: maxFloor.trim() === "" ? null : Number(maxFloor),
      requiresLift,
      requiresParking,
      requiresPetFriendly,
      requiresBachelorFriendly,
      keyPlaces: keyPlaces
        .filter((k) => k.name.trim() && k.maxKm.trim())
        .map((k) => ({ name: k.name.trim(), maxKm: Number(k.maxKm) })),
      softPreferences,
    });

    setSubmitting(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald/15 text-emerald">
          ✓
        </div>
        <h1 className="text-lg font-semibold">Thanks, {name} — you&rsquo;re set.</h1>
        <p className="mt-2 text-sm text-muted">
          Your dealbreakers are saved. Share a listing to the bot anytime, and check the{" "}
          <a href="/dashboard" className="text-accent underline underline-offset-4">
            dashboard
          </a>{" "}
          once everyone&rsquo;s in.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-6 rounded-full border border-border px-4 py-2 text-sm hover:border-accent/50"
        >
          Edit answers
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hey {name} 👋</h1>
        <p className="mt-1 text-sm text-muted">
          Set your dealbreakers once. You can edit these anytime — Roomiess re-checks every
          listing against the latest version.
        </p>
      </div>

      <Section title="Dealbreakers">
        <Field label="Max rent share, per person (₹/month)">
          <input
            type="number"
            required
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            className="input"
            placeholder="12000"
          />
        </Field>

        <Field label="Areas you won't consider">
          <div className="flex flex-wrap gap-2">
            {noGoAreas.map((area) => (
              <span
                key={area}
                className="flex items-center gap-1.5 rounded-full bg-rose/15 px-3 py-1 text-xs text-rose"
              >
                {area}
                <button
                  type="button"
                  onClick={() => setNoGoAreas(noGoAreas.filter((a) => a !== area))}
                  className="text-rose/70 hover:text-rose"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={noGoInput}
              onChange={(e) => setNoGoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNoGo();
                }
              }}
              className="input"
              placeholder="e.g. Kothrud"
            />
            <button type="button" onClick={addNoGo} className="btn-secondary">
              Add
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min bathrooms">
            <input
              type="number"
              min={0}
              value={minBathrooms}
              onChange={(e) => setMinBathrooms(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Highest floor you'd accept">
            <input
              type="number"
              min={0}
              value={maxFloor}
              onChange={(e) => setMaxFloor(e.target.value)}
              className="input"
              placeholder="No limit"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Toggle label="Needs a lift" checked={requiresLift} onChange={setRequiresLift} />
          <Toggle
            label="Needs parking"
            checked={requiresParking}
            onChange={setRequiresParking}
          />
          <Toggle
            label="Pet-friendly required"
            checked={requiresPetFriendly}
            onChange={setRequiresPetFriendly}
          />
          <Toggle
            label="Bachelor-friendly required"
            checked={requiresBachelorFriendly}
            onChange={setRequiresBachelorFriendly}
          />
        </div>

        <Field label="Key places (up to 2) — e.g. office, family">
          <div className="space-y-2">
            {keyPlaces.map((kp, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={kp.name}
                  onChange={(e) => {
                    const next = [...keyPlaces];
                    next[i] = { ...next[i], name: e.target.value };
                    setKeyPlaces(next);
                  }}
                  className="input flex-[2]"
                  placeholder="e.g. Hinjewadi office"
                />
                <input
                  type="number"
                  value={kp.maxKm}
                  onChange={(e) => {
                    const next = [...keyPlaces];
                    next[i] = { ...next[i], maxKm: e.target.value };
                    setKeyPlaces(next);
                  }}
                  className="input w-24"
                  placeholder="max km"
                />
              </div>
            ))}
            {keyPlaces.length < 2 && (
              <button
                type="button"
                onClick={() => setKeyPlaces([...keyPlaces, { name: "", maxKm: "" }])}
                className="btn-secondary"
              >
                + Add another place
              </button>
            )}
          </div>
        </Field>
      </Section>

      <Section title="Nice-to-haves (0 = don't care)">
        {PREDEFINED_PREFS.map((label) => (
          <SliderField
            key={label}
            label={label}
            value={weights[label] ?? 0}
            onChange={(v) => setWeights({ ...weights, [label]: v })}
          />
        ))}
        <div className="flex items-center gap-3">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="input flex-1"
            placeholder="Your own factor (optional)"
          />
          <input
            type="range"
            min={0}
            max={5}
            value={customWeight}
            onChange={(e) => setCustomWeight(Number(e.target.value))}
            className="w-32 accent-accent"
          />
          <span className="w-4 text-right text-sm text-muted">{customWeight}</span>
        </div>
      </Section>

      {error && <p className="text-sm text-rose">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Saving…" : "Save my dealbreakers"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-5 text-sm font-semibold text-foreground/90">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
        checked ? "border-accent/50 bg-accent/10 text-accent" : "border-border text-foreground/80"
      }`}
    >
      {label}
      <span
        className={`ml-2 h-4 w-4 shrink-0 rounded-full border ${
          checked ? "border-accent bg-accent" : "border-border"
        }`}
      />
    </button>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-foreground/80">{label}</span>
      <input
        type="range"
        min={0}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-accent"
      />
      <span className="w-4 text-right text-sm text-muted">{value}</span>
    </div>
  );
}
