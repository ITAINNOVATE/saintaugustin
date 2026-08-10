import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CourseCatalog } from "@/components/courses/CourseCatalog";

export const metadata = { title: "Mes Cours" };

const defaultCourses = [
  {
    id: "course-1",
    title: "Signalisation & Panneaux de la Route",
    description: "Apprenez à identifier tous les panneaux de signalisation avec nos vidéos et cours audio.",
    category: "Signalisation",
    level: "Débutant",
    is_published: true,
    chapters: [
      {
        id: "ch-1",
        title: "Chapitre 1 : Introduction et Panneaux de Danger",
        order_index: 0,
        lessons: [
          { id: "les-v1", title: "📹 Cours Vidéo : Comprendre la Signalisation Routière", lesson_type: "video", duration: 300, order_index: 0, is_published: true },
          { id: "les-a1", title: "🎙️ Cours Audio : Les Panneaux d'Interdiction & Obligation", lesson_type: "audio", duration: 240, order_index: 1, is_published: true },
          { id: "les-t1", title: "📚 Synthèse Écrite : Glossaire des Panneaux", lesson_type: "text", duration: 180, order_index: 2, is_published: true },
        ],
      },
    ],
  },
  {
    id: "course-2",
    title: "Règles de Priorité & Intersections",
    description: "Maîtrisez la priorité à droite, les rond-points et le croisement en ville.",
    category: "Circulation",
    level: "Intermédiaire",
    is_published: true,
    chapters: [
      {
        id: "ch-2",
        title: "Chapitre 1 : Priorité à Droite & Carrefours",
        order_index: 0,
        lessons: [
          { id: "les-v2", title: "📹 Cours Vidéo : Franchissement d'un Rond-Point", lesson_type: "video", duration: 420, order_index: 0, is_published: true },
          { id: "les-a2", title: "🎙️ Podcast Audio : Les 5 erreurs fatales en intersection", lesson_type: "audio", duration: 360, order_index: 1, is_published: true },
        ],
      },
    ],
  },
];

export default async function CoursPage() {
  const supabase = await createClient();

  let user: any = null;
  try { const res = await supabase.auth.getUser(); user = res.data.user; } catch {}

  let userRole = "apprenant";
  let userName = "Apprenant";
  
  if (user) {
    try {
      const r: any = await supabase.from("profiles").select("first_name, last_name, role").eq("id", user.id).single();
      if (r?.data) {
        userRole = r.data.role || "apprenant";
        userName = `${r.data.first_name || ""} ${r.data.last_name || ""}`;
      }
    } catch {}
    
    if (user.email === "admin@saintaugustin.com") {
      userRole = "admin";
      if (userName === "Apprenant") userName = "Administrateur Saint Augustin";
    }
  }

  let studentId = "";
  try {
    if (user) {
      const res: any = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (res?.data) studentId = res.data.id;
    }
  } catch {}

  let courses: any[] = [];
  try {
    const res = await supabase.from("courses").select("*, chapters(id, title, order_index, is_published, lessons(id, title, lesson_type, duration, order_index, is_published))").eq("is_published", true).order("order_index");
    courses = res.data || [];
  } catch {}

  let progressMap: Record<string, any> = {};
  try {
    if (studentId) {
      const res = await supabase.from("lesson_progress").select("lesson_id, is_completed, progress_percent, last_position").eq("student_id", studentId);
      const entries = (res.data as any[] || []).map((p: any) => [p.lesson_id, p]);
      progressMap = Object.fromEntries(entries);
    }
  } catch {}

  const displayCourses = courses.length > 0 ? courses : defaultCourses;

  return (
    <DashboardLayout userRole={userRole as any} userName={userName} pageTitle="Mes Cours de Code">
      <CourseCatalog courses={displayCourses} progressMap={progressMap} studentId={studentId} />
    </DashboardLayout>
  );
}
