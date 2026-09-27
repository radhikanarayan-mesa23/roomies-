import { GoogleGenAI } from "@google/genai";
import type { StructuredListing } from "./types";

const MODEL = "gemini-3.8-flash";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    location: { type: "STRING", nullable: true },
    normalized_locality: {
      type: "STRING",
      nullable: true,
      description: "Just the locality/area name, e.g. 'Baner', 'Kothrud', 'Hinjewadi'.",
    },
    monthly_rent: { type: "NUMBER", nullable: true },
    floor_number: { type: "INTEGER", nullable: true },
    total_floors: { type: "INTEGER", nullable: true },
    has_lift: { type: "BOOLEAN", nullable: true },
    has_parking: { type: "BOOLEAN", nullable: true },
    bathrooms: { type: "INTEGER", nullable: true },
    pet_friendly: { type: "BOOLEAN", nullable: true },
    bachelor_friendly: { type: "BOOLEAN", nullable: true },
    furnishing: { type: "STRING", nullable: true },
    security_deposit: { type: "NUMBER", nullable: true },
    brokerage: { type: "STRING", nullable: true },
    available_from: { type: "STRING", nullable: true },
    other_notes: {
      type: "STRING",
      nullable: true,
      description: "Any other relevant detail from the listing not captured above (amenities, vibe, etc).",
    },
  },
  required: [
    "location",
    "normalized_locality",
    "monthly_rent",
    "floor_number",
    "total_floors",
    "has_lift",
    "has_parking",
    "bathrooms",
    "pet_friendly",
    "bachelor_friendly",
    "furnishing",
    "security_deposit",
    "brokerage",
    "available_from",
    "other_notes",
  ],
} as const;

const PROMPT = `You extract structured facts from a flat/room listing message shared between flatmates house-hunting in Pune, India.

Rules:
- Only extract what is explicitly stated or unambiguously implied in the text.
- If a field is not mentioned, return null for it. NEVER guess or infer a plausible value.
- monthly_rent, security_deposit are numbers in INR (strip currency symbols/commas).
- floor_number: 0 for ground floor. total_floors is the building's total floor count.
- normalized_locality should be just the area/locality name (e.g. "Baner"), not the full address.

Listing text:
"""
{{TEXT}}
"""`;

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function extractListing(rawText: string): Promise<StructuredListing> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: PROMPT.replace("{{TEXT}}", rawText),
    config: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: RESPONSE_SCHEMA as any,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed = JSON.parse(text) as StructuredListing;
  return parsed;
}
