import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PermisManagement } from "@/components/permis/PermisManagement";

export const metadata = { title: "Gestion des Permis" };

export default async function PermisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };

  let permits: any = null;
  try {
    const { data } = await supabase
      .from("learner_permits")
      .select("*, students(id, first_name, last_name, matricule)")
      .order("created_at", { ascending: false });
    permits = data;
  } catch {}

  return (
    <DashboardLayout userRole={profile.role} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Permis Délivrés">
      <PermisManagement permits={permits || []} adminId={user?.id || "demo-admin-id"} userRole={profile.role} />
    </DashboardLayout>
  );
}
