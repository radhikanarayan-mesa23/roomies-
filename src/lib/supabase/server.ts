import { createClient } from "@supabase/supabase-js";

// Server-only. Uses the service role key and talks to the isolated
// `roomiess` schema so it can never see or touch the other app's tables
// that live in `public` on this shared Supabase project. Never import this
// from client components.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(url, key, {
    db: { schema: "roomiess" },
    auth: { persistSession: false },
  });
}
