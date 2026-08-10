import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zhctrwqvdmcvkuldqmso.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdminProfile() {
  const userId = "27655145-06f1-4108-bcce-52f57a951410";
  console.log("Setting admin profile for user:", userId);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: "admin",
        first_name: "Administrateur",
        last_name: "Saint Augustin",
        is_active: true,
      },
      { onConflict: "id" }
    )
    .select();

  if (error) {
    console.error("Error setting admin profile:", error.message);
  } else {
    console.log("✓ Profile admin avec succès pour l'utilisateur ID:", userId, data);
  }
}

setAdminProfile();
