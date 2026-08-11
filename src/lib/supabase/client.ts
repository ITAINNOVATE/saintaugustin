"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : "https://zhctrwqvdmcvkuldqmso.supabase.co";

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, options) => {
        const u = typeof url === "string" ? url : (url as Request).url;
        if (u.includes("placeholder.supabase.co") || u.includes("your-project.supabase.co")) {
          return Promise.resolve(
            new Response(JSON.stringify([]), {
              status: 200,
              headers: { "content-type": "application/json" },
            })
          );
        }
        return fetch(url, options);
      },
    },
  });
}
