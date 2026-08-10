import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentsManagement } from "@/components/students/StudentsManagement";

export const metadata = { title: "Tableau de bord Secrétaire" };

export default async function SecretairePage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Secrétaire", last_name: "Saint Augustin", role: "secretaire" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let students: any[] = [];
  try {
    const res = await supabase.from("students").select("*, subscriptions(id, status, plan, end_date)").order("created_at", { ascending: false });
    students = res.data || [];
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Gestion des Apprenants">
      <StudentsManagement students={students} userRole={profile.role as any} />
    </DashboardLayout>
  );
}
