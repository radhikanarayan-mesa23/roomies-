import type { evaluateListing } from "./matching";
import type { StructuredListing } from "./types";

export function summarizeListing(s: StructuredListing): string {
  const parts: string[] = [];
  parts.push(s.normalized_locality ?? s.location ?? "Locality not confirmed");
  parts.push(s.monthly_rent != null ? `₹${s.monthly_rent.toLocaleString("en-IN")}/mo` : "rent not confirmed");
  if (s.floor_number != null) parts.push(`floor ${s.floor_number}`);
  return parts.join(" · ");
}

export function formatVerdictForTelegram(verdict: ReturnType<typeof evaluateListing>): string {
  const lines: string[] = [];
  for (const p of verdict.perPerson) {
    const scoreText = p.score != null ? `${p.score.toFixed(1)}/5` : "no preferences set";
    lines.push(`${p.participantName} — ${scoreText}`);
    if (p.dealbreakerGaps.length === 0) {
      lines.push("  ✅ Works — every preference met");
    } else {
      for (const gap of p.dealbreakerGaps) lines.push(`  ❌ ${gap}`);
    }
    if (p.givesUp.length > 0) {
      lines.push(`  ⚠️ Gives up: ${p.givesUp.map((g) => `${g.label} (${g.weight})`).join(", ")}`);
    }
    if (p.notConfirmed.length > 0) {
      lines.push(`  ◌ Not confirmed: ${p.notConfirmed.join(", ")}`);
    }
  }
  return lines.join("\n");
}
