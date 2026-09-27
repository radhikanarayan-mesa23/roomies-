import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ingestListing, missingDealbreakerFields } from "@/lib/ingest";
import { evaluateListing } from "@/lib/matching";
import type { Participant, Preferences } from "@/lib/types";
import { formatVerdictForTelegram, summarizeListing } from "@/lib/verdictText";
import {
  extractUrl,
  isBareUrl,
  matchKnownName,
  sendTelegramMessage,
} from "@/lib/telegram";

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
    caption?: string;
    photo?: unknown[];
  };
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const db = supabaseAdmin();

  const { error: insertError } = await db
    .from("telegram_updates")
    .insert({ update_id: update.update_id });
  if (insertError) {
    // Already seen this update_id - idempotent no-op.
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const text = message.text ?? message.caption ?? null;

  const { data: existingParticipant } = await db
    .from("participants")
    .select("*")
    .eq("telegram_user_id", chatId)
    .maybeSingle();

  if (!existingParticipant) {
    if (text?.trim() === "/start") {
      await sendTelegramMessage(chatId, "Welcome to Roomiess! Reply with your name (Riya, Meera, or Kavita).");
      return NextResponse.json({ ok: true });
    }
    const matchedName = text ? matchKnownName(text) : null;
    if (matchedName) {
      const { data: participant } = await db
        .from("participants")
        .select("*")
        .ilike("name", matchedName)
        .maybeSingle();
      if (participant) {
        await db.from("participants").update({ telegram_user_id: chatId }).eq("id", participant.id);
        const baseUrl = process.env.APP_BASE_URL ?? "";
        await sendTelegramMessage(
          chatId,
          `Hey ${participant.name}! Here's your dealbreakers form: ${baseUrl}/form/${participant.form_token}\n\nOnce you've filled it, just paste any listing here and I'll check it against everyone instantly.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Unknown sender, no name match - tell them what to do instead of
    // silently dropping their message (this used to swallow listings
    // pasted before linking, with zero feedback).
    await sendTelegramMessage(
      chatId,
      "I don't recognize you yet — reply with your name (Riya, Meera, or Kavita) so I know whose dealbreakers this is. Then resend your listing and I'll check it."
    );
    return NextResponse.json({ ok: true });
  }

  // Known user from here on.
  if (!text) return NextResponse.json({ ok: true });

  if (isBareUrl(text)) {
    await sendTelegramMessage(
      chatId,
      "That's just a link — paste the listing details too (rent, floor, area, etc.) so I can check it. The link itself is kept as the source."
    );
    return NextResponse.json({ ok: true });
  }

  const sourceUrl = extractUrl(text);

  try {
    const result = await ingestListing({
      rawText: text,
      sourceUrl,
      sourceChannel: "telegram",
      submittedBy: existingParticipant.id,
    });

    if (result.duplicate) {
      await sendTelegramMessage(chatId, "Already added this one — it's on the dashboard.");
      return NextResponse.json({ ok: true });
    }

    const { listing } = result;
    const lines = [summarizeListing(listing.structured)];

    const missing = missingDealbreakerFields(listing.structured);
    if (missing.length > 0) {
      lines.push(`Not mentioned: ${missing.join(", ")} — resend with these if you know them.`);
    }

    const { data: allParticipants } = await db.from("participants").select("*");
    const allReady = (allParticipants ?? []).every((p: Participant) => p.form_submitted_at);
    if (allReady && allParticipants) {
      const { data: prefsRows } = await db.from("preferences").select("*");
      const prefsByParticipant = Object.fromEntries(
        (prefsRows ?? []).map((p: Preferences) => [p.participant_id, p])
      );
      const verdict = evaluateListing(listing, allParticipants, prefsByParticipant);
      lines.push("");
      lines.push(formatVerdictForTelegram(verdict));
    }

    const baseUrl = process.env.APP_BASE_URL ?? "";
    lines.push("");
    lines.push(`Dashboard: ${baseUrl}/dashboard`);

    await sendTelegramMessage(chatId, lines.join("\n"));
  } catch (err) {
    await sendTelegramMessage(
      chatId,
      `Couldn't process that listing (${err instanceof Error ? err.message : "unknown error"}). Try again?`
    );
  }

  return NextResponse.json({ ok: true });
}
