import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MoniteurEvaluations } from "@/components/conduite/MoniteurEvaluations";

export const metadata = {
  title: "Évaluations de Conduite | Auto École Saint Augustin",
};

export default async function MoniteurPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Moniteur", last_name: "Conduite", role: "moniteur" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let students: any[] = [];
  try {
    const res = await supabase.from("students").select("*").order("created_at", { ascending: false });
    students = res.data || [];
  } catch {}

  let evaluations: any[] = [];
  try {
    const res = await supabase.from("driving_evaluations").select("*, students(id, first_name, last_name, matricule)").order("created_at", { ascending: false });
    evaluations = res.data || [];
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Évaluations de Conduite">
      <MoniteurEvaluations
        students={students}
        initialEvaluations={evaluations as any}
        instructorId={user?.id || "moniteur"}
      />
    </DashboardLayout>
  );
}
