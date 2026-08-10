import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zhctrwqvdmcvkuldqmso.supabase.co";
const supabaseKey = "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminCredentials() {
  console.log("Checking admin@saintaugustin.com login with Admin123...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: "admin@saintaugustin.com",
    password: "Admin123",
  });

  if (error) {
    console.error("❌ Sign in failed:", error.message, error.status);
  } else {
    console.log("✅ Sign in successful! User ID:", data.user?.id);
    
    // Ensure profile is correctly set to admin
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user?.id)
      .single();
    
    console.log("Profile data:", prof);
    if (profErr) console.error("Profile fetch error:", profErr.message);
  }
}

checkAdminCredentials();
