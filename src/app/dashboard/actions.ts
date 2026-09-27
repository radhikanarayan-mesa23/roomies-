"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Toggles one participant's "interested" mark on a listing. Purely
 * informational - never ranks, hides, or auto-selects a winner. The group
 * still decides for themselves by looking at the verdicts and the votes
 * together.
 */
export async function toggleInterest(listingId: string, participantId: string) {
  const db = supabaseAdmin();
  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("interested_by")
    .eq("id", listingId)
    .single();
  if (fetchError) throw fetchError;

  const current: string[] = listing.interested_by ?? [];
  const next = current.includes(participantId)
    ? current.filter((id) => id !== participantId)
    : [...current, participantId];

  const { error } = await db.from("listings").update({ interested_by: next }).eq("id", listingId);
  if (error) throw error;

  revalidatePath("/dashboard");
}

export async function updateViewingNotes(listingId: string, notes: string) {
  const db = supabaseAdmin();
  const { error } = await db
    .from("listings")
    .update({ viewing_notes: notes.trim() || null })
    .eq("id", listingId);
  if (error) throw error;

  revalidatePath("/dashboard");
}

/**
 * A human action: the friends themselves click this to say "this is the
 * one" - the app never computes or suggests a winner on its own. Only one
 * listing can be finalized at a time, so finalizing a new one clears any
 * previous pick.
 */
export async function finalizeListing(listingId: string) {
  const db = supabaseAdmin();
  const { error: clearError } = await db
    .from("listings")
    .update({ is_finalized: false })
    .neq("id", listingId);
  if (clearError) throw clearError;

  const { error } = await db.from("listings").update({ is_finalized: true }).eq("id", listingId);
  if (error) throw error;

  revalidatePath("/dashboard");
}

export async function unfinalizeListing(listingId: string) {
  const db = supabaseAdmin();
  const { error } = await db.from("listings").update({ is_finalized: false }).eq("id", listingId);
  if (error) throw error;

  revalidatePath("/dashboard");
}
