import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: any };

  const roleRoutes: Record<string, string> = {
    admin: "/admin",
    directeur: "/directeur",
    secretaire: "/secretaire",
    apprenant: "/apprenant/cours",
  };

  redirect(roleRoutes[profile?.role || "apprenant"] || "/apprenant/cours");
}
