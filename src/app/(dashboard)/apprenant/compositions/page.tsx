import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CompositionsCatalog } from "@/components/compositions/CompositionsCatalog";

export const metadata = {
  title: "Compositions E-Exam | Auto École Saint Augustin",
  description: "Accédez aux sujets de composition chronométrés avec audio synchronisé.",
};

const OFFICIAL_SUBJECTS = Array.from({ length: 46 }, (_, i) => {
  const numStr = (i + 1).toString().padStart(2, "0");
  const categories: ("A" | "B" | "C" | "D")[] = ["B", "B", "A", "C", "D"];
  const difficulties: ("Facile" | "Moyen" | "Difficile")[] = ["Moyen", "Difficile", "Facile"];
  return {
    id: `sujet-${numStr}`,
    title: `Sujet Officiel N°${numStr} — Examen Théorique`,
    permit_category: categories[i % categories.length],
    duration_minutes: 20, total_questions: 20, pass_score: 16,
    difficulty: difficulties[i % difficulties.length],
    audio_url: `/SUJETS%20FRANCAIS/sujet_${numStr}.mp4`,
    can_go_back: true, show_explanations: true, is_published: true,
    created_at: new Date().toISOString(),
  };
});

export default async function CompositionsPage() {
  let user: any = null;
  let profile = { first_name: "Apprenant", last_name: "Démo", role: "apprenant" };
  let studentId = "demo-student-id";
  let subjects: any[] = [];
  let sessions: any[] = [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    try { const r = await supabase.auth.getUser(); user = r.data?.user ?? null; } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
        if (r?.data) profile = { ...profile, ...r.data };
      }
    } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
        if (r?.data?.id) studentId = r.data.id;
      }
    } catch {}

    try {
      const r = await supabase.from("composition_subjects").select("*, questions(*)").eq("is_published", true).order("created_at", { ascending: false });
      subjects = r.data || [];
    } catch {}

    try {
      const r = await supabase.from("composition_sessions").select("*, subject:composition_subjects(*)").eq("student_id", studentId).order("completed_at", { ascending: false });
      sessions = r.data || [];
    } catch {}
  } catch {}

  const displaySubjects = subjects.length > 0 ? subjects : OFFICIAL_SUBJECTS;

  return (
    <DashboardLayout userRole={(profile.role as any) || "apprenant"} userName={`${profile.first_name} ${profile.last_name}`} pageTitle="Compositions E-Exam">
      <CompositionsCatalog subjects={displaySubjects as any} userSessions={sessions as any} studentId={studentId} />
    </DashboardLayout>
  );
}
