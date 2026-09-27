import { supabaseAdmin } from "./supabase/server";
import { extractListing } from "./gemini";
import { geocodePlace } from "./geocode";
import { dedupeHash } from "./dedupe";
import type { Listing, StructuredListing } from "./types";

export type IngestResult =
  | { duplicate: true; existing: Listing }
  | { duplicate: false; listing: Listing };

const DEALBREAKER_FIELDS: Array<keyof StructuredListing> = [
  "monthly_rent",
  "normalized_locality",
  "bathrooms",
  "floor_number",
  "has_lift",
  "has_parking",
  "pet_friendly",
  "bachelor_friendly",
];

export function missingDealbreakerFields(structured: StructuredListing): string[] {
  return DEALBREAKER_FIELDS.filter((f) => structured[f] == null).map((f) => f.replace(/_/g, " "));
}

/**
 * Extracts, dedupes, geocodes and saves a listing. Shared by the /add web
 * flow and the Telegram bot so both surfaces behave identically.
 */
export async function ingestListing(params: {
  rawText: string;
  sourceUrl: string | null;
  sourceChannel: "telegram" | "web";
  submittedBy: string | null;
}): Promise<IngestResult> {
  const db = supabaseAdmin();
  const hash = dedupeHash(params.rawText);

  const { data: existing } = await db
    .from("listings")
    .select("*")
    .eq("dedupe_hash", hash)
    .maybeSingle();
  if (existing) {
    return { duplicate: true, existing: existing as Listing };
  }

  const structured = await extractListing(params.rawText);

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (structured.normalized_locality) {
    const geo = await geocodePlace(structured.normalized_locality);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
    }
  }

  const { data, error } = await db
    .from("listings")
    .insert({
      raw_text: params.rawText,
      source_url: params.sourceUrl,
      source_channel: params.sourceChannel,
      submitted_by: params.submittedBy,
      structured,
      latitude,
      longitude,
      dedupe_hash: hash,
    })
    .select("*")
    .single();
  if (error) throw error;

  return { duplicate: false, listing: data as Listing };
}
