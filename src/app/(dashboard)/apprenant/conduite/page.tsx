import { createClient, createAdminClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentConduiteView } from "@/components/conduite/StudentConduiteView";

export const metadata = { title: "Cours Conduite | Auto École Saint Augustin" };

export default async function ApprenantConduitePage() {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Apprenant", last_name: "", role: "apprenant" };
  try {
    if (user) {
      const res: any = await adminSupabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let studentId = "";
  let matricule = "N/A";
  try {
    if (user) {
      const res: any = await adminSupabase.from("students").select("id, matricule").eq("user_id", user.id).single();
      if (res?.data) { studentId = res.data.id; matricule = res.data.matricule; }
    }
  } catch {}

  let evaluations: any[] = [];
  try {
    if (studentId) {
      const res: any = await adminSupabase
        .from("driving_evaluations")
        .select("*")
        .eq("student_id", studentId)
        .order("evaluation_date", { ascending: false })
        .order("created_at", { ascending: false });
      evaluations = res?.data || [];
    }
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Cours Conduite">
      <StudentConduiteView evaluations={evaluations as any} studentName={`${profile.first_name} ${profile.last_name}`} matricule={matricule} />
    </DashboardLayout>
  );
}
