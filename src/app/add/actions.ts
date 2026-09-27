"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { extractListing } from "@/lib/gemini";
import { geocodePlace } from "@/lib/geocode";
import { dedupeHash } from "@/lib/dedupe";
import { missingDealbreakerFields } from "@/lib/ingest";
import type { Participant, StructuredListing } from "@/lib/types";

export async function getParticipantsForAdd(): Promise<Participant[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("participants").select("*").order("name");
  if (error) throw error;
  return data as Participant[];
}

export async function previewListing(rawText: string): Promise<
  | { duplicate: true }
  | { duplicate: false; structured: StructuredListing; missingFields: string[] }
> {
  const db = supabaseAdmin();
  const hash = dedupeHash(rawText);
  const { data: existing } = await db
    .from("listings")
    .select("id")
    .eq("dedupe_hash", hash)
    .maybeSingle();
  if (existing) return { duplicate: true };

  const structured = await extractListing(rawText);
  return { duplicate: false, structured, missingFields: missingDealbreakerFields(structured) };
}

export async function confirmListing(params: {
  rawText: string;
  sourceUrl: string | null;
  submittedBy: string;
  structured: StructuredListing;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin();
  const hash = dedupeHash(params.rawText);

  const { data: existing } = await db
    .from("listings")
    .select("id")
    .eq("dedupe_hash", hash)
    .maybeSingle();
  if (existing) return { ok: false, error: "This listing was already added." };

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (params.structured.normalized_locality) {
    const geo = await geocodePlace(params.structured.normalized_locality);
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
    }
  }

  const { error } = await db.from("listings").insert({
    raw_text: params.rawText,
    source_url: params.sourceUrl,
    source_channel: "web",
    submitted_by: params.submittedBy,
    structured: params.structured,
    latitude,
    longitude,
    dedupe_hash: hash,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
