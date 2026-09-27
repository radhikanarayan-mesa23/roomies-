"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { geocodePlace } from "@/lib/geocode";

export type FormPayload = {
  maxRent: number;
  noGoAreas: string[];
  minBathrooms: number;
  maxFloor: number | null;
  requiresLift: boolean;
  requiresParking: boolean;
  requiresPetFriendly: boolean;
  requiresBachelorFriendly: boolean;
  keyPlaces: { name: string; maxKm: number }[];
  softPreferences: { label: string; weight: number; is_custom: boolean }[];
};

export async function submitForm(
  token: string,
  payload: FormPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin();

  const { data: participant, error: findError } = await db
    .from("participants")
    .select("id")
    .eq("form_token", token)
    .maybeSingle();
  if (findError) return { ok: false, error: findError.message };
  if (!participant) return { ok: false, error: "Form link not recognized." };

  const keyPlaces = [];
  for (const kp of payload.keyPlaces.slice(0, 2)) {
    if (!kp.name.trim()) continue;
    const geo = await geocodePlace(kp.name);
    keyPlaces.push({
      name: kp.name.trim(),
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      max_km: kp.maxKm,
    });
  }

  const { error: upsertError } = await db.from("preferences").upsert(
    {
      participant_id: participant.id,
      max_rent: payload.maxRent,
      no_go_areas: payload.noGoAreas,
      min_bathrooms: payload.minBathrooms,
      max_floor: payload.maxFloor,
      requires_lift: payload.requiresLift,
      requires_parking: payload.requiresParking,
      requires_pet_friendly: payload.requiresPetFriendly,
      requires_bachelor_friendly: payload.requiresBachelorFriendly,
      key_places: keyPlaces,
      soft_preferences: payload.softPreferences,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" }
  );
  if (upsertError) return { ok: false, error: upsertError.message };

  const { error: participantError } = await db
    .from("participants")
    .update({ form_submitted_at: new Date().toISOString() })
    .eq("id", participant.id);
  if (participantError) return { ok: false, error: participantError.message };

  return { ok: true };
}

export async function getExistingPreferences(token: string) {
  const db = supabaseAdmin();
  const { data: participant } = await db
    .from("participants")
    .select("id, name, form_submitted_at")
    .eq("form_token", token)
    .maybeSingle();
  if (!participant) return null;

  const { data: prefs } = await db
    .from("preferences")
    .select("*")
    .eq("participant_id", participant.id)
    .maybeSingle();

  return { participant, prefs };
}
