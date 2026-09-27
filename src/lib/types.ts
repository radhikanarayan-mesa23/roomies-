// Shared domain types for Roomiess.

export type Participant = {
  id: string;
  name: string;
  telegram_user_id: number | null;
  form_token: string;
  form_submitted_at: string | null;
};

export type KeyPlace = {
  name: string;
  lat: number | null;
  lng: number | null;
  max_km: number;
};

export type SoftPreference = {
  label: string;
  weight: number; // 0-5, 0 = don't care
  is_custom: boolean;
};

export type Preferences = {
  participant_id: string;
  max_rent: number | null;
  no_go_areas: string[];
  min_bathrooms: number | null;
  max_floor: number | null; // null = no limit
  requires_lift: boolean;
  requires_parking: boolean;
  requires_pet_friendly: boolean;
  requires_bachelor_friendly: boolean;
  key_places: KeyPlace[];
  soft_preferences: SoftPreference[];
};

// Fields Gemini extracts from a pasted listing. Every field is null if not
// stated in the source text - never guessed.
export type StructuredListing = {
  location: string | null;
  normalized_locality: string | null;
  monthly_rent: number | null;
  floor_number: number | null;
  total_floors: number | null;
  has_lift: boolean | null;
  has_parking: boolean | null;
  bathrooms: number | null;
  pet_friendly: boolean | null;
  bachelor_friendly: boolean | null;
  furnishing: string | null;
  security_deposit: number | null;
  brokerage: string | null;
  available_from: string | null;
  other_notes: string | null;
};

export type Listing = {
  id: string;
  raw_text: string;
  source_url: string | null;
  source_channel: "telegram" | "web";
  submitted_by: string | null;
  structured: StructuredListing;
  latitude: number | null;
  longitude: number | null;
  dedupe_hash: string;
  created_at: string;
};

export type GivesUpItem = {
  label: string;
  weight: number;
};

export type PersonVerdict = {
  participantId: string;
  participantName: string;
  dealbreakerGaps: string[]; // empty = works
  score: number | null; // out of 5, one decimal. null = "no preferences set"
  givesUp: GivesUpItem[];
  notConfirmed: string[];
};

export type ListingVerdict = {
  listingId: string;
  perPerson: PersonVerdict[];
  zeroDealbreakerCount: number;
  averageScore: number; // for ranking, treats null scores as not counted
  notConfirmedCount: number;
};
