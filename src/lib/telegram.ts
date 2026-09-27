export async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
}

const KNOWN_NAMES = ["Riya", "Meera", "Kavita"];

/**
 * Matches a known participant's name in a short reply. Exact match first
 * ("Riya"), then falls back to a whole-word match for short messages only
 * ("I'm Riya!", "riya here") so we don't accidentally match a name
 * mentioned inside a long pasted listing.
 */
export function matchKnownName(text: string): string | null {
  const trimmed = text.trim();
  const exact = KNOWN_NAMES.find((n) => n.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  if (trimmed.length <= 40) {
    const lower = trimmed.toLowerCase();
    return KNOWN_NAMES.find((n) => new RegExp(`\\b${n.toLowerCase()}\\b`).test(lower)) ?? null;
  }
  return null;
}

const URL_RE = /https?:\/\/\S+/i;

export function extractUrl(text: string): string | null {
  const match = text.match(URL_RE);
  return match ? match[0] : null;
}

export function isBareUrl(text: string): boolean {
  const url = extractUrl(text);
  return !!url && text.trim() === url;
}
