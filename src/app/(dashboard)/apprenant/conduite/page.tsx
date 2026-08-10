import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StudentConduiteView } from "@/components/conduite/StudentConduiteView";

export const metadata = {
  title: "Cours Conduite | Auto École Saint Augustin",
  description: "Carnet d'évaluation pratique en conduite automobile.",
};

export default async function ApprenantConduitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Apprenant";
  let userRole = "apprenant";
  let studentId = "";
  let matricule = "STD-2026-001";

  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .single()) as { data: any };

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
      userRole = profile.role || "apprenant";
    }

    const { data: student } = (await supabase
      .from("students")
      .select("id, matricule")
      .eq("user_id", user.id)
      .single()) as { data: any };

    if (student) {
      studentId = student.id;
      matricule = student.matricule;
    }
  }

  // Fetch driving evaluation for this student
  const { data: evaluation } = studentId
    ? await supabase
        .from("driving_evaluations")
        .select("*")
        .eq("student_id", studentId)
        .single()
    : { data: null };

  // Demo fallback evaluation if none exists in database
  const demoEvaluation = evaluation || {
    id: "demo-eval-1",
    student_id: studentId || "demo-student",
    evaluation_date: "2026-08-03",
    ml1: "Très Bien",
    ml2: "Bien",
    ml3: "Passable",
    r1: "Bien",
    r2: "Passable",
    r3: "Très Bien",
    zigzag1: "Très Bien",
    zigzag2: "Bien",
    zigzag3: "Très Bien",
    cr1: "Bien",
    cr2: "Passable",
    cr3: "Bien",
    comments: "Bonne maîtrise globale des manœuvres et du slalom. Attention à bien contrôler vos angles morts avant d'entrer sur le rond-point.",
    created_at: "2026-08-03T10:00:00Z",
  };

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Cours Conduite">
      <StudentConduiteView
        evaluation={(demoEvaluation as any) || null}
        studentName={userName}
        matricule={matricule}
      />
    </DashboardLayout>
  );
}
