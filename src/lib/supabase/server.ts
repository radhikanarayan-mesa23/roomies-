import { createClient } from "@supabase/supabase-js";

// Server-only. Uses the service role key against Roomiess's own dedicated
// Supabase project (public schema). Never import this from client
// components.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
