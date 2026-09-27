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

export function matchKnownName(text: string): string | null {
  const trimmed = text.trim().toLowerCase();
  return KNOWN_NAMES.find((n) => n.toLowerCase() === trimmed) ?? null;
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
