import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && url.startsWith("http") ? url : "https://zhctrwqvdmcvkuldqmso.supabase.co";
};

const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";
const getSupabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoY3Ryd3F2ZG1jdmt1bGRxbXNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAyNDE3NywiZXhwIjoyMTAxNjAwMTc3fQ.rWsLapbii7DjvrLAqVog4AQ-aSm0-7Ej8z6o9fX_zOA";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}

export async function createAdminClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );
}
