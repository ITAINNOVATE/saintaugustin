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
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = `${profile.first_name || ""} ${profile.last_name || ""}`;
    }

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

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

  // Demo Fallback Subjects if none in DB
  const defaultSubjects = [
    {
      id: "subj-1",
      title: "Sujet Officiel N°1 — Signalisation & Priorités",
      permit_category: "B" as const,
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Moyen" as const,
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "subj-2",
      title: "Sujet Officiel N°2 — Croisements & Dépassements",
      permit_category: "B" as const,
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Difficile" as const,
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "subj-3",
      title: "Sujet Officiel N°3 — Code Général & Éco-Conduite",
      permit_category: "B" as const,
      duration_minutes: 15,
      total_questions: 15,
      pass_score: 12,
      difficulty: "Facile" as const,
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      can_go_back: true,
      show_explanations: true,
      is_published: true,
      created_at: new Date().toISOString(),
    },
  ];

  const displaySubjects = subjects && subjects.length > 0 ? subjects : defaultSubjects;

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
