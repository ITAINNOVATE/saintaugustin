import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LessonContent } from "@/components/courses/LessonContent";

export const metadata = { title: "Lecture de la leçon" };

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single() as { data: any };
  if (!profile) redirect("/login");

  const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single() as { data: any };
  if (!student) redirect("/login");

  let { data: lesson } = (await supabase
    .from("lessons")
    .select("*, chapters(title, id)")
    .eq("id", lessonId)
    .single()) as { data: any };

  // Demo Fallback Lessons for Audio & Video
  if (!lesson) {
    if (lessonId === "les-v1") {
      lesson = {
        id: "les-v1",
        title: "📹 Cours Vidéo : Comprendre la Signalisation Routière",
        description: "Visionnez cette leçon vidéo pour comprendre le rôle et la portée des panneaux de signalisation.",
        lesson_type: "video",
        file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        content: "Bienvenue dans cette leçon vidéo interactive. Observez attentivement les explications visuelles concernant la catégorisation des panneaux (Danger, Interdiction, Obligation, Indication).\n\nPoints clés retenus :\n1. Les panneaux triangulaires indiquent un DANGER.\n2. Les panneaux rond à bord rouge indiquent une INTERDICTION.\n3. Les panneaux rond à fond bleu indiquent une OBLIGATION.\n4. Les panneaux carrés indiquent une INDICATION.",
        chapters: { title: "Chapitre 1 : Introduction et Panneaux de Danger", id: "ch-1" },
      };
    } else if (lessonId === "les-a1") {
      lesson = {
        id: "les-a1",
        title: "🎙️ Cours Audio : Les Panneaux d'Interdiction & Obligation",
        description: "Écoutez l'explication audio détaillée du moniteur sur les panneaux d'interdiction et d'obligation.",
        lesson_type: "audio",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        content: "Bienvenue dans le podcast audio de l'Auto École Saint Augustin.\n\nDans cet enregistrement audio, votre moniteur détaille les spécificités de la signalisation d'interdiction et d'obligation.\n\nConseil d'écoute : Utilisez le régulateur de vitesse (1x, 1.25x ou 1.5x) pour écouter à votre rythme et réservez les 10 secondes de retour pour réécouter les passages complexes.",
        chapters: { title: "Chapitre 1 : Introduction et Panneaux de Danger", id: "ch-1" },
      };
    } else if (lessonId === "les-v2") {
      lesson = {
        id: "les-v2",
        title: "📹 Cours Vidéo : Franchissement d'un Rond-Point",
        description: "Vidéo explicative sur les règles de placement et d'indicateur de direction (clignotant) en rond-point.",
        lesson_type: "video",
        file_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        content: "Guide vidéo de placement dans un carrefour à sens giratoire (Rond-Point) :\n- Si vous allez tout droit ou à droite : Restez sur la voie de droite et mettez le clignotant droit avant de sortir.\n- Si vous allez à gauche ou faites demi-tour : Placez-vous sur la voie de gauche, mettez le clignotant gauche puis le clignotant droit pour sortir.",
        chapters: { title: "Chapitre 1 : Priorité à Droite & Carrefours", id: "ch-2" },
      };
    } else if (lessonId === "les-a2") {
      lesson = {
        id: "les-a2",
        title: "🎙️ Podcast Audio : Les 5 erreurs fatales en intersection",
        description: "Écoutez les recommandations audio de votre moniteur pour éviter les refus de priorité.",
        lesson_type: "audio",
        file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        content: "Enregistrement de conseil pratique pour l'examen théorique et pratique.\n\nErreurs fréquentes analysées :\n1. Oublier de regarder à droite à une intersection sans signalisation.\n2. Ne pas ralentir à l'approche d'un panneau 'Cédez le Passage'.\n3. Marquer un arrêt incomplet au panneau STOP.\n4. Mauvais contrôle de l'angle mort au moment de tourner.",
        chapters: { title: "Chapitre 1 : Priorité à Droite & Carrefours", id: "ch-2" },
      };
    } else {
      lesson = {
        id: lessonId,
        title: "📚 Synthèse Écrite du Cours",
        description: "Document d'étude du Code de la Route.",
        lesson_type: "text",
        content: "Résumé détaillé des cours théoriques pour l'examen du permis de conduire.",
        chapters: { title: "Formation Théorique", id: "ch-1" },
      };
    }
  }

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .single();

  // Fetch sibling lessons in the same chapter to allow navigation
  const { data: chapterLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("chapter_id", lesson.chapter_id)
    .order("order_index") as { data: any[] | null };

  const currentIndex = chapterLessons?.findIndex(l => l.id === lessonId) ?? -1;
  const prevLessonId = currentIndex > 0 ? chapterLessons?.[currentIndex - 1]?.id : null;
  const nextLessonId = currentIndex >= 0 && currentIndex < (chapterLessons?.length ?? 0) - 1 
    ? chapterLessons?.[currentIndex + 1]?.id 
    : null;

  return (
    <DashboardLayout userRole="apprenant" userName={`${profile.first_name} ${profile.last_name}`} pageTitle={lesson.title}>
      <LessonContent
        lesson={lesson}
        initialProgress={progress}
        studentId={student.id}
        courseId={courseId}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
      />
    </DashboardLayout>
  );
}
