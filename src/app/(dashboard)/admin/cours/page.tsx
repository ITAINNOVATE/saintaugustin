
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCoursesManagement } from "@/components/courses/AdminCoursesManagement";

export const metadata = { title: "Gestion des Cours" };

const DEFAULT_COURSES = [
  {
    id: "course-1",
    title: "Signalisation & Panneaux de la Route",
    description: "Apprenez à identifier tous les panneaux de signalisation avec nos vidéos et cours audio.",
    category: "Signalisation", level: "Débutant", is_published: true,
    chapters: [{
      id: "ch-1", title: "Chapitre 1 : Introduction et Panneaux de Danger", order_index: 0, is_published: true,
      lessons: [
        { id: "les-v1", title: "📹 Cours Vidéo : Comprendre la Signalisation Routière", lesson_type: "video", duration: 300, order_index: 0, is_published: true },
        { id: "les-a1", title: "🎙️ Cours Audio : Les Panneaux d'Interdiction & Obligation", lesson_type: "audio", duration: 240, order_index: 1, is_published: true },
        { id: "les-t1", title: "📚 Synthèse Écrite : Glossaire des Panneaux", lesson_type: "text", duration: 180, order_index: 2, is_published: true },
      ],
    }],
  },
  {
    id: "course-2",
    title: "Règles de Priorité & Intersections",
    description: "Maîtrisez la priorité à droite, les rond-points et le croisement en ville.",
    category: "Circulation", level: "Intermédiaire", is_published: true,
    chapters: [{
      id: "ch-2", title: "Chapitre 1 : Priorité à Droite & Carrefours", order_index: 0, is_published: true,
      lessons: [
        { id: "les-v2", title: "📹 Cours Vidéo : Franchissement d'un Rond-Point", lesson_type: "video", duration: 420, order_index: 0, is_published: true },
        { id: "les-a2", title: "🎙️ Podcast Audio : Les 5 erreurs fatales en intersection", lesson_type: "audio", duration: 360, order_index: 1, is_published: true },
      ],
    }],
  },
];

export default async function AdminCoursesPage() {
  let user: any = null;
  let profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  let courses: any[] = [];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    try { const r = await supabase.auth.getUser(); user = r.data?.user ?? null; } catch {}

    try {
      if (user) {
        const r: any = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (r?.data) profile = { ...profile, ...r.data };
      }
    } catch {}

    try {
      const r = await supabase
        .from("courses")
        .select("*, chapters(id, title, order_index, is_published, lessons(id, title, lesson_type, is_published, order_index))")
        .order("order_index");
      courses = r.data || [];
    } catch {}
  } catch {}

  const displayCourses = courses.length > 0 ? courses : DEFAULT_COURSES;

  return (
    <DashboardLayout
      userRole={(profile.role as any) || "admin"}
      userName={`${profile.first_name} ${profile.last_name}`}
      pageTitle="Gestion des Cours"
    >
      <AdminCoursesManagement courses={displayCourses} adminId={user?.id || "admin"} />
    </DashboardLayout>
  );
}
