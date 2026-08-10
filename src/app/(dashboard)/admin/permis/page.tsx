import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PermisManagement } from "@/components/permis/PermisManagement";

export const metadata = { title: "Gestion des Permis" };

export default async function PermisPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let permits: any[] = [];
  try {
    const res = await supabase.from("learner_permits").select("*, students(id, first_name, last_name, matricule)").order("created_at", { ascending: false });
    permits = res.data || [];
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Permis Délivrés">
      <PermisManagement permits={permits} adminId={user?.id || "admin"} userRole={profile.role as any} />
    </DashboardLayout>
  );
}
