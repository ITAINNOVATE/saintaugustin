import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentConduiteView } from "@/components/conduite/StudentConduiteView";

export const metadata = { title: "Cours Conduite | Auto École Saint Augustin" };

const demoEvaluation = {
  id: "demo-eval-1",
  student_id: "demo-student",
  evaluation_date: "2026-08-03",
  ml1: "Très Bien", ml2: "Bien", ml3: "Passable",
  r1: "Bien", r2: "Passable", r3: "Très Bien",
  zigzag1: "Très Bien", zigzag2: "Bien", zigzag3: "Très Bien",
  cr1: "Bien", cr2: "Passable", cr3: "Bien",
  comments: "Bonne maîtrise globale des manœuvres et du slalom.",
  created_at: "2026-08-03T10:00:00Z",
};

export default async function ApprenantConduitePage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  const profile = { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };
  try {
    if (user) {
      const res: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (res?.data) Object.assign(profile, res.data);
    }
  } catch {}

  let studentId = "";
  let matricule = "STD-2026-001";
  try {
    if (user) {
      const res: any = await supabase.from("students").select("id, matricule").eq("user_id", user.id).single();
      if (res?.data) { studentId = res.data.id; matricule = res.data.matricule; }
    }
  } catch {}

  let evaluation: any = null;
  try {
    if (studentId) {
      const res: any = await supabase.from("driving_evaluations").select("*").eq("student_id", studentId).single();
      evaluation = res?.data || null;
    }
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Cours Conduite">
      <StudentConduiteView evaluation={(evaluation || demoEvaluation) as any} studentName={`${profile.first_name} ${profile.last_name}`} matricule={matricule} />
    </DashboardLayout>
  );
}
