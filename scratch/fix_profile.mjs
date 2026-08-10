import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zhctrwqvdmcvkuldqmso.supabase.co";
const supabaseKey = "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminProfile() {
  const userId = "6f90dc60-35f0-4817-99ae-fbcb52c47f39";
  console.log("Upserting profile for user:", userId);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      role: "admin",
      first_name: "Administrateur",
      last_name: "Saint Augustin",
      is_active: true
    }, { onConflict: "id" })
    .select();

  if (error) {
    console.error("Upsert profile error:", error.message);
  } else {
    console.log("✓ Profile successfully upserted:", data);
  }
}

fixAdminProfile();
