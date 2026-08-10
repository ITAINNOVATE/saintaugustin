import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompositionsCatalog } from "@/components/compositions/CompositionsCatalog";

export const metadata = {
  title: "Compositions E-Exam | Auto École Saint Augustin",
  description: "Accédez aux sujets de composition chronométrés avec audio synchronisé.",
};

export default async function CompositionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName = "Apprenant";
  let studentId = "demo-student-id";

  if (user) {
    const { data: profile } = (await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single()) as { data: any };

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
    }

    const { data: student } = (await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single()) as { data: any };

    if (student) {
      studentId = student.id;
    }
  }

  // Fetch subjects
  const { data: subjects } = await supabase
    .from("composition_subjects")
    .select("*, questions(*)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Fetch student sessions
  const { data: sessions } = await supabase
    .from("composition_sessions")
    .select("*, subject:composition_subjects(*)")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false });

  // Generate all 46 official subjects from public/SUJETS FRANCAIS/
  const officialSubjects = Array.from({ length: 46 }, (_, i) => {
    const numStr = (i + 1).toString().padStart(2, "0");
    const categories: ("A" | "B" | "C" | "D")[] = ["B", "B", "A", "C", "D"];
    const difficulties: ("Facile" | "Moyen" | "Difficile")[] = ["Moyen", "Difficile", "Facile"];
    return {
      id: `sujet-${numStr}`,
      title: `Sujet Officiel N°${numStr} — Examen Théorique`,
      permit_category: categories[i % categories.length],
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: difficulties[i % difficulties.length],
      audio_url: `/SUJETS%20FRANCAIS/sujet_${numStr}.mp4`,
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    };
  });

  const displaySubjects = subjects && subjects.length > 0 ? subjects : officialSubjects;

  return (
    <DashboardLayout userRole="apprenant" userName={userName} pageTitle="Compositions E-Exam">
      <CompositionsCatalog
        subjects={(displaySubjects as any) || []}
        userSessions={(sessions as any) || []}
        studentId={studentId}
      />
    </DashboardLayout>
  );
}
