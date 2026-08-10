import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LessonContent } from "@/components/courses/LessonContent";

export const metadata = { title: "Lecture de la leçon" };

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

const DEMO_LESSONS: Record<string, any> = {
  "les-v1": {
    id: "les-v1", title: "📹 Cours Vidéo : Comprendre la Signalisation Routière",
    description: "Visionnez cette leçon vidéo pour comprendre le rôle et la portée des panneaux de signalisation.",
    lesson_type: "video", file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    content: "Points clés :\n1. Les panneaux triangulaires → DANGER.\n2. Les panneaux ronds à bord rouge → INTERDICTION.\n3. Les panneaux ronds à fond bleu → OBLIGATION.\n4. Les panneaux carrés → INDICATION.",
    chapters: { title: "Chapitre 1 : Introduction et Panneaux de Danger", id: "ch-1" },
  },
  "les-a1": {
    id: "les-a1", title: "🎙️ Cours Audio : Les Panneaux d'Interdiction & Obligation",
    description: "Écoutez l'explication audio détaillée sur les panneaux.", lesson_type: "audio",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    content: "Podcast de l'Auto École Saint Augustin : la signalisation d'interdiction et d'obligation.",
    chapters: { title: "Chapitre 1 : Introduction et Panneaux de Danger", id: "ch-1" },
  },
  "les-v2": {
    id: "les-v2", title: "📹 Cours Vidéo : Franchissement d'un Rond-Point",
    description: "Vidéo explicative sur les règles en rond-point.", lesson_type: "video",
    file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    content: "Guide vidéo de placement dans un carrefour à sens giratoire.",
    chapters: { title: "Chapitre 1 : Priorité à Droite & Carrefours", id: "ch-2" },
  },
  "les-a2": {
    id: "les-a2", title: "🎙️ Podcast Audio : Les 5 erreurs fatales en intersection",
    description: "Recommandations audio pour éviter les refus de priorité.", lesson_type: "audio",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    content: "Erreurs fréquentes : 1. Oublier de regarder à droite. 2. Ne pas ralentir au Cédez le Passage. 3. Arrêt incomplet au STOP.",
    chapters: { title: "Chapitre 1 : Priorité à Droite & Carrefours", id: "ch-2" },
  },
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}
  if (!user) redirect("/login");

  // Get profile — allow admin/any role to view lesson pages
  const profile = { first_name: "Utilisateur", last_name: "", role: "apprenant" };
  try {
    const res: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (res?.data) Object.assign(profile, res.data);
  } catch {}

  // Fail-safe for admin email
  if (user.email === "admin@saintaugustin.com") {
    profile.role = "admin";
    if (!profile.first_name || profile.first_name === "Utilisateur") {
      profile.first_name = "Administrateur";
      profile.last_name = "Saint Augustin";
    }
  }

  // Get student id — admin won't have one; use a fallback
  let studentId = "preview-student";
  try {
    const res: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
    if (res?.data?.id) studentId = res.data.id;
  } catch {}

  // Fetch lesson from DB, fallback to demo content
  let lesson: any = null;
  try {
    const res: any = await supabase.from("lessons").select("*, chapters(title, id)").eq("id", lessonId).single();
    lesson = res?.data || null;
  } catch {}

  if (!lesson) {
    lesson = DEMO_LESSONS[lessonId] || {
      id: lessonId, title: "📚 Synthèse Écrite du Cours", description: "Document d'étude du Code de la Route.",
      lesson_type: "text", content: "Résumé détaillé des cours théoriques pour l'examen du permis de conduire.",
      chapters: { title: "Formation Théorique", id: "ch-1" },
    };
  }

  // Fetch progress — for admin preview use null
  let progress: any = null;
  try {
    const res: any = await supabase.from("lesson_progress").select("*").eq("student_id", studentId).eq("lesson_id", lessonId).single();
    progress = res?.data || null;
  } catch {}

  // Fetch sibling lessons for navigation
  let prevLessonId: string | null = null;
  let nextLessonId: string | null = null;
  try {
    const res: any = await supabase.from("lessons").select("id, title, order_index").eq("chapter_id", lesson.chapter_id).order("order_index");
    const chapterLessons: any[] = res?.data || [];
    const currentIndex = chapterLessons.findIndex((l: any) => l.id === lessonId);
    prevLessonId = currentIndex > 0 ? chapterLessons[currentIndex - 1]?.id : null;
    nextLessonId = currentIndex >= 0 && currentIndex < chapterLessons.length - 1 ? chapterLessons[currentIndex + 1]?.id : null;
  } catch {}

  return (
    <DashboardLayout userRole={profile.role as any} userName={`${profile.first_name} ${profile.last_name}`} pageTitle={lesson.title}>
      <LessonContent
        lesson={lesson}
        initialProgress={progress}
        studentId={studentId}
        courseId={courseId}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
      />
    </DashboardLayout>
  );
}
