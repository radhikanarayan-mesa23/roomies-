import { haversineKm } from "./haversine";
import type {
  GivesUpItem,
  KeyPlace,
  Listing,
  ListingVerdict,
  Participant,
  PersonVerdict,
  Preferences,
} from "./types";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatKm(n: number): string {
  return `${n.toFixed(1)} km`;
}

/**
 * Hard dealbreaker checks for one listing against one person's preferences.
 * Returns gap statements (one per failed check - never just the first) and
 * a list of fields that could not be evaluated because the source data was
 * null ("not confirmed", never treated as a fail).
 */
export function checkDealbreakers(
  listing: Listing,
  prefs: Preferences,
  personName: string
): { gaps: string[]; notConfirmed: string[] } {
  const gaps: string[] = [];
  const notConfirmed: string[] = [];
  const s = listing.structured;

  // Rent share - equal 3-way split.
  if (s.monthly_rent == null) {
    notConfirmed.push("rent");
  } else if (prefs.max_rent != null) {
    const share = s.monthly_rent / 3;
    if (share > prefs.max_rent) {
      gaps.push(
        `Rent share ${formatINR(share)} — ${personName}'s max is ${formatINR(
          prefs.max_rent
        )} (${formatINR(share - prefs.max_rent)} over)`
      );
    }
  }

  // No-go areas.
  if (!s.normalized_locality) {
    notConfirmed.push("locality");
  } else if (prefs.no_go_areas.length > 0) {
    const locality = s.normalized_locality.toLowerCase();
    const hit = prefs.no_go_areas.find((area) =>
      locality.includes(area.toLowerCase())
    );
    if (hit) {
      gaps.push(
        `In ${s.normalized_locality} — ${personName} marked ${hit} as a no-go area`
      );
    }
  }

  // Bathrooms.
  if (s.bathrooms == null) {
    notConfirmed.push("bathrooms");
  } else if (prefs.min_bathrooms != null && s.bathrooms < prefs.min_bathrooms) {
    const short = prefs.min_bathrooms - s.bathrooms;
    gaps.push(
      `${s.bathrooms} bathroom${s.bathrooms === 1 ? "" : "s"} — ${personName} needs at least ${
        prefs.min_bathrooms
      } (${short} short)`
    );
  }

  // Floor.
  if (prefs.max_floor != null) {
    if (s.floor_number == null) {
      notConfirmed.push("floor");
    } else if (s.floor_number > prefs.max_floor) {
      const over = s.floor_number - prefs.max_floor;
      gaps.push(
        `${ordinal(s.floor_number)} floor — ${personName}'s max is ${ordinal(
          prefs.max_floor
        )} floor (${over} floor${over === 1 ? "" : "s"} over)`
      );
    }
  }

  // Lift / parking / pet-friendly / bachelor-friendly.
  const boolChecks: Array<{
    required: boolean;
    value: boolean | null;
    field: string;
    label: string;
    failText: string;
  }> = [
    {
      required: prefs.requires_lift,
      value: s.has_lift,
      field: "lift",
      label: "lift",
      failText: `No lift — ${personName} requires a lift`,
    },
    {
      required: prefs.requires_parking,
      value: s.has_parking,
      field: "parking",
      label: "parking",
      failText: `No parking — ${personName} requires parking`,
    },
    {
      required: prefs.requires_pet_friendly,
      value: s.pet_friendly,
      field: "pet-friendly",
      label: "pet-friendly",
      failText: `Not pet-friendly — ${personName} requires pet-friendly`,
    },
    {
      required: prefs.requires_bachelor_friendly,
      value: s.bachelor_friendly,
      field: "bachelor-friendly",
      label: "bachelor-friendly",
      failText: `Not bachelor-friendly — ${personName} requires bachelor-friendly`,
    },
  ];
  for (const check of boolChecks) {
    if (!check.required) continue;
    if (check.value == null) {
      notConfirmed.push(check.field);
    } else if (check.value === false) {
      gaps.push(check.failText);
    }
  }

  // Key places - straight-line distance.
  for (const place of prefs.key_places) {
    const gap = checkKeyPlace(listing, place, personName);
    if (gap.status === "not_confirmed") notConfirmed.push(`distance to ${place.name}`);
    else if (gap.status === "fail") gaps.push(gap.text!);
  }

  return { gaps, notConfirmed };
}

function checkKeyPlace(
  listing: Listing,
  place: KeyPlace,
  personName: string
): { status: "ok" | "fail" | "not_confirmed"; text?: string } {
  if (
    listing.latitude == null ||
    listing.longitude == null ||
    place.lat == null ||
    place.lng == null
  ) {
    return { status: "not_confirmed" };
  }
  const km = haversineKm(listing.latitude, listing.longitude, place.lat, place.lng);
  if (km > place.max_km) {
    return {
      status: "fail",
      text: `${formatKm(km)} from ${place.name} (straight-line) — ${personName}'s max is ${place.max_km} km (${formatKm(
        km - place.max_km
      )} extra)`,
    };
  }
  return { status: "ok" };
}

const PREFERENCE_KEYWORDS: Record<string, string[]> = {
  furnished: ["furnished"],
  balcony: ["balcony"],
  "natural light": ["natural light", "sunny", "well-lit", "well lit"],
  "society amenities": ["amenities", "clubhouse", "gym", "swimming pool", "society"],
  "quiet locality": ["quiet", "peaceful", "calm"],
  "near public transport": ["metro", "bus stop", "bus stand", "station", "transport"],
  vastu: ["vastu"],
  "water supply": ["water supply", "24x7 water", "borewell"],
};

function preferenceMatched(pref: { label: string; is_custom: boolean }, listing: Listing): boolean {
  const s = listing.structured;
  const haystack = `${s.other_notes ?? ""} ${s.furnishing ?? ""}`.toLowerCase();

  if (!pref.is_custom && pref.label.toLowerCase() === "furnished") {
    if (s.furnishing && /furnished/i.test(s.furnishing) && !/unfurnished/i.test(s.furnishing)) {
      return true;
    }
  }

  const keywords = pref.is_custom
    ? [pref.label.toLowerCase()]
    : PREFERENCE_KEYWORDS[pref.label.toLowerCase()] ?? [pref.label.toLowerCase()];

  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

/**
 * Preference score out of 5 for one listing/person pair. Never overrides a
 * dealbreaker - purely informational. Returns null when the person has no
 * preferences with weight > 0 ("no preferences set").
 */
export function scorePreferences(
  listing: Listing,
  prefs: Preferences
): { score: number | null; givesUp: GivesUpItem[] } {
  const active = prefs.soft_preferences.filter((p) => p.weight > 0);
  if (active.length === 0) return { score: null, givesUp: [] };

  let matchedWeight = 0;
  let totalWeight = 0;
  const givesUp: GivesUpItem[] = [];

  for (const pref of active) {
    totalWeight += pref.weight;
    if (preferenceMatched(pref, listing)) {
      matchedWeight += pref.weight;
    } else {
      givesUp.push({ label: pref.label, weight: pref.weight });
    }
  }

  const score = Math.round((matchedWeight / totalWeight) * 5 * 10) / 10;
  return { score, givesUp };
}

export function matchListingForPerson(
  listing: Listing,
  participant: Participant,
  prefs: Preferences
): PersonVerdict {
  const { gaps, notConfirmed } = checkDealbreakers(listing, prefs, participant.name);
  const { score, givesUp } = scorePreferences(listing, prefs);
  return {
    participantId: participant.id,
    participantName: participant.name,
    dealbreakerGaps: gaps,
    score,
    givesUp,
    notConfirmed,
  };
}

export function evaluateListing(
  listing: Listing,
  participants: Participant[],
  preferencesByParticipant: Record<string, Preferences>
): ListingVerdict {
  const perPerson = participants.map((p) =>
    matchListingForPerson(listing, p, preferencesByParticipant[p.id])
  );
  const zeroDealbreakerCount = perPerson.filter((p) => p.dealbreakerGaps.length === 0).length;
  const scored = perPerson.filter((p) => p.score != null) as (PersonVerdict & { score: number })[];
  const averageScore =
    scored.length > 0 ? scored.reduce((sum, p) => sum + p.score, 0) / scored.length : 0;
  const notConfirmedCount = perPerson.reduce((sum, p) => sum + p.notConfirmed.length, 0);

  return {
    listingId: listing.id,
    perPerson,
    zeroDealbreakerCount,
    averageScore,
    notConfirmedCount,
  };
}

/**
 * Ranks listings: more people with zero dealbreakers first, then higher
 * average preference score, then fewer "not confirmed" fields. A listing
 * with a dealbreaker never outranks one where all 3 people are clear, no
 * matter how high its score.
 */
export function rankListings(verdicts: ListingVerdict[]): ListingVerdict[] {
  return [...verdicts].sort((a, b) => {
    if (b.zeroDealbreakerCount !== a.zeroDealbreakerCount) {
      return b.zeroDealbreakerCount - a.zeroDealbreakerCount;
    }
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    return a.notConfirmedCount - b.notConfirmedCount;
  });
}

export function shortlist(verdicts: ListingVerdict[]): ListingVerdict[] {
  const ranked = rankListings(verdicts);
  return ranked.filter((v) => v.zeroDealbreakerCount >= 2).slice(0, 3);
}
