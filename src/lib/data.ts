import { supabaseAdmin } from "./supabase/server";
import { evaluateListing, rankListings, shortlist as pickShortlist } from "./matching";
import type { Listing, Participant, Preferences } from "./types";

export async function getParticipants(): Promise<Participant[]> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("participants").select("*").order("name");
  if (error) throw error;
  return data as Participant[];
}

export async function getPreferencesMap(): Promise<Record<string, Preferences>> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("preferences").select("*");
  if (error) throw error;
  const map: Record<string, Preferences> = {};
  for (const row of data as Preferences[]) {
    map[row.participant_id] = row;
  }
  return map;
}

export async function getListings(): Promise<Listing[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Listing[];
}

export type BoardState =
  | { ready: false; waitingOn: string[] }
  | {
      ready: true;
      shortlistIds: string[];
      verdicts: ReturnType<typeof evaluateListing>[];
      listingsById: Record<string, Listing>;
    };

export async function buildBoard(): Promise<BoardState> {
  const participants = await getParticipants();
  const waitingOn = participants.filter((p) => !p.form_submitted_at).map((p) => p.name);
  if (waitingOn.length > 0) {
    return { ready: false, waitingOn };
  }

  const prefsMap = await getPreferencesMap();
  const listings = await getListings();
  const verdicts = listings.map((l) => evaluateListing(l, participants, prefsMap));
  const ranked = rankListings(verdicts);
  const shortlistIds = pickShortlist(verdicts).map((v) => v.listingId);
  const listingsById = Object.fromEntries(listings.map((l) => [l.id, l]));

  return {
    ready: true,
    shortlistIds,
    verdicts: ranked,
    listingsById,
  };
}
