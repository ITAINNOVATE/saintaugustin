import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zhctrwqvdmcvkuldqmso.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log("Testing Supabase auth endpoint...");
  console.log("URL:", supabaseUrl);
  console.log("KEY prefix:", supabaseKey.slice(0, 15));

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@saintaugustin.com",
    password: "test",
  });

  console.log("SignIn Data:", data);
  console.log("SignIn Error:", error);
}

testAuth();
