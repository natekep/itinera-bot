// src/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseKey) {
	if (import.meta.env.DEV) {
		// In dev, don't crash the app if envs are missing; just disable Supabase-backed features.
		// Provide a clear console hint so it's easy to fix.
		// To enable locally, add a .env or .env.development with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
		// Example:
		// VITE_SUPABASE_URL="https://xxxx.supabase.co"
		// VITE_SUPABASE_ANON_KEY="xxxxx"
		console.warn(
			"[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Auth features are disabled in dev."
		);
	}
} else {
	supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };
