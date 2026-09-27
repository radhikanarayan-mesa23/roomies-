import { createHash } from "crypto";

export function dedupeHash(text: string): string {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}
