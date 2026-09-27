import { describe, expect, it } from "vitest";
import {
  checkDealbreakers,
  evaluateListing,
  rankListings,
  scorePreferences,
} from "./matching";
import type { Listing, Participant, Preferences, StructuredListing } from "./types";

function structured(overrides: Partial<StructuredListing> = {}): StructuredListing {
  return {
    location: "Baner, Pune",
    normalized_locality: "Baner",
    monthly_rent: 36000,
    floor_number: 2,
    total_floors: 5,
    has_lift: true,
    has_parking: true,
    bathrooms: 2,
    pet_friendly: true,
    bachelor_friendly: true,
    furnishing: "semi-furnished",
    security_deposit: null,
    brokerage: null,
    available_from: null,
    other_notes: null,
    ...overrides,
  };
}

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "listing-1",
    raw_text: "3BHK in Baner",
    source_url: null,
    source_channel: "web",
    submitted_by: null,
    structured: structured(),
    latitude: 18.56,
    longitude: 73.78,
    dedupe_hash: "hash-1",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function prefs(overrides: Partial<Preferences> = {}): Preferences {
  return {
    participant_id: "p1",
    max_rent: 15000,
    no_go_areas: [],
    min_bathrooms: 1,
    max_floor: null,
    requires_lift: false,
    requires_parking: false,
    requires_pet_friendly: false,
    requires_bachelor_friendly: false,
    key_places: [],
    soft_preferences: [],
    ...overrides,
  };
}

function person(name: string, id = name.toLowerCase()): Participant {
  return { id, name, telegram_user_id: null, form_token: "tok", form_submitted_at: new Date().toISOString() };
}

describe("checkDealbreakers", () => {
  it("flags a missing lift for Meera", () => {
    const l = listing({ structured: structured({ has_lift: false }) });
    const p = prefs({ requires_lift: true, max_rent: 100000 });
    const { gaps } = checkDealbreakers(l, p, "Meera");
    expect(gaps).toContain("No lift — Meera requires a lift");
  });

  it("flags a 5th floor listing against Riya's max of 3rd floor with exact wording", () => {
    const l = listing({ structured: structured({ floor_number: 5 }) });
    const p = prefs({ max_floor: 3, max_rent: 100000 });
    const { gaps } = checkDealbreakers(l, p, "Riya");
    expect(gaps).toContain("5th floor — Riya's max is 3rd floor (2 floors over)");
  });

  it("flags distance over the limit for Kavita using fixed coordinates", () => {
    // Same longitude, latitude delta of 0.0648 deg ~= 7.2 km (1 deg lat ~= 111.32 km).
    const l = listing({ latitude: 18.0648, longitude: 73.0 });
    const p = prefs({
      max_rent: 100000,
      key_places: [{ name: "Hinjewadi", lat: 18.0, lng: 73.0, max_km: 6 }],
    });
    const { gaps } = checkDealbreakers(l, p, "Kavita");
    expect(gaps.length).toBe(1);
    expect(gaps[0]).toMatch(/^7\.2 km from Hinjewadi \(straight-line\) — Kavita's max is 6 km \(1\.2 km extra\)$/);
  });

  it("flags Kothrud as a no-go area for Riya", () => {
    const l = listing({ structured: structured({ normalized_locality: "Kothrud" }) });
    const p = prefs({ max_rent: 100000, no_go_areas: ["Kothrud"] });
    const { gaps } = checkDealbreakers(l, p, "Riya");
    expect(gaps).toContain("In Kothrud — Riya marked Kothrud as a no-go area");
  });

  it("reports null parking as not confirmed, never as a fail", () => {
    const l = listing({ structured: structured({ has_parking: null }) });
    const p = prefs({ max_rent: 100000, requires_parking: true });
    const { gaps, notConfirmed } = checkDealbreakers(l, p, "Meera");
    expect(gaps).toEqual([]);
    expect(notConfirmed).toContain("parking");
  });

  it("lists every failed check, not just the first", () => {
    const l = listing({
      structured: structured({ monthly_rent: 36000, bathrooms: 1, has_lift: false }),
    });
    const p = prefs({ max_rent: 5000, min_bathrooms: 2, requires_lift: true });
    const { gaps } = checkDealbreakers(l, p, "Meera");
    expect(gaps.length).toBe(3);
  });
});

describe("scorePreferences", () => {
  it("returns null when no preferences are set", () => {
    const l = listing();
    const p = prefs({ soft_preferences: [] });
    expect(scorePreferences(l, p).score).toBeNull();
  });

  it("never lets a high score override a dealbreaker in ranking", () => {
    const participants = [person("Riya"), person("Meera"), person("Kavita")];

    // Listing A: fails a dealbreaker for one person but scores 5/5 everywhere.
    const listingA = listing({
      id: "A",
      structured: structured({ has_lift: false, other_notes: "big balcony, quiet street" }),
    });
    const prefsA: Record<string, Preferences> = {
      riya: prefs({ max_rent: 100000, soft_preferences: [{ label: "balcony", weight: 5, is_custom: false }] }),
      meera: prefs({
        max_rent: 100000,
        requires_lift: true,
        soft_preferences: [{ label: "quiet locality", weight: 5, is_custom: false }],
      }),
      kavita: prefs({ max_rent: 100000, soft_preferences: [{ label: "balcony", weight: 5, is_custom: false }] }),
    };

    // Listing B: zero dealbreakers for everyone, but no preferences matched.
    const listingB = listing({ id: "B", structured: structured({ has_lift: true, other_notes: "" }) });
    const prefsB: Record<string, Preferences> = {
      riya: prefs({ max_rent: 100000, soft_preferences: [{ label: "balcony", weight: 5, is_custom: false }] }),
      meera: prefs({ max_rent: 100000, soft_preferences: [{ label: "quiet locality", weight: 5, is_custom: false }] }),
      kavita: prefs({ max_rent: 100000, soft_preferences: [{ label: "balcony", weight: 5, is_custom: false }] }),
    };

    const verdictA = evaluateListing(listingA, participants, {
      riya: prefsA.riya,
      meera: prefsA.meera,
      kavita: prefsA.kavita,
    });
    const verdictB = evaluateListing(listingB, participants, {
      riya: prefsB.riya,
      meera: prefsB.meera,
      kavita: prefsB.kavita,
    });

    expect(verdictA.zeroDealbreakerCount).toBe(2);
    expect(verdictB.zeroDealbreakerCount).toBe(3);

    const [top] = rankListings([verdictA, verdictB]);
    expect(top.listingId).toBe("B");
  });
});
