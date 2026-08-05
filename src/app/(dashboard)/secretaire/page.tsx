import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentsManagement } from "@/components/students/StudentsManagement";

export const metadata = { title: "Tableau de bord Secrétaire" };

export default async function SecretairePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? (await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any }).data
    : { first_name: "Secrétaire", last_name: "Saint Augustin", role: "secretaire" };
  const { data: students } = await supabase.from("students").select("*, subscriptions(id, status, plan, end_date)").order("created_at", { ascending: false });
  return (
    <DashboardLayout userRole="secretaire" userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Apprenants">
      <StudentsManagement students={students || []} userRole="secretaire" />
    </DashboardLayout>
  );
}
