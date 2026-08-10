import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zhctrwqvdmcvkuldqmso.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0TzawnZq09BuvBUOPOb9Fw_xLYGkBBY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCourses() {
  console.log("Seeding courses to Supabase...");

  const defaultCourses = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Signalisation & Panneaux de la Route",
      description: "Apprenez à identifier tous les panneaux de signalisation avec nos vidéos et cours audio.",
      category: "Signalisation",
      level: "débutant",
      is_published: true,
      order_index: 0,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      title: "Règles de Priorité & Intersections",
      description: "Maîtrisez la priorité à droite, les rond-points et le croisement en ville.",
      category: "Circulation",
      level: "débutant",
      is_published: true,
      order_index: 1,
    },
  ];

  for (const course of defaultCourses) {
    const { error: cErr } = await supabase.from("courses").upsert(course, { onConflict: "id" });
    if (cErr) console.error("Error inserting course:", course.title, cErr.message);
    else console.log("✓ Course inserted/updated:", course.title);
  }

  const chapters = [
    {
      id: "00000000-0000-0000-0000-000000000011",
      course_id: "00000000-0000-0000-0000-000000000001",
      title: "Chapitre 1 : Introduction et Panneaux de Danger",
      order_index: 0,
      is_published: true,
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      course_id: "00000000-0000-0000-0000-000000000002",
      title: "Chapitre 1 : Priorité à Droite & Carrefours",
      order_index: 0,
      is_published: true,
    },
  ];

  for (const ch of chapters) {
    const { error: chErr } = await supabase.from("chapters").upsert(ch, { onConflict: "id" });
    if (chErr) console.error("Error inserting chapter:", ch.title, chErr.message);
    else console.log("✓ Chapter inserted/updated:", ch.title);
  }

  const lessons = [
    {
      id: "00000000-0000-0000-0000-000000000101",
      chapter_id: "00000000-0000-0000-0000-000000000011",
      course_id: "00000000-0000-0000-0000-000000000001",
      title: "Cours Vidéo : Comprendre la Signalisation Routière",
      lesson_type: "video",
      duration: 300,
      order_index: 0,
      is_published: true,
      content: "Explication détaillée des familles de panneaux de signalisation routière (Danger, Interdiction, Obligation, Indication).",
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      chapter_id: "00000000-0000-0000-0000-000000000011",
      course_id: "00000000-0000-0000-0000-000000000001",
      title: "Cours Audio : Les Panneaux d'Interdiction & Obligation",
      lesson_type: "audio",
      duration: 240,
      order_index: 1,
      is_published: true,
      content: "Ecoutez l'analyse des panneaux ronds rouges d'interdiction et ronds bleus d'obligation.",
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      chapter_id: "00000000-0000-0000-0000-000000000011",
      course_id: "00000000-0000-0000-0000-000000000001",
      title: "Synthèse Écrite : Glossaire des Panneaux",
      lesson_type: "text",
      duration: 180,
      order_index: 2,
      is_published: true,
      content: "Fiche récapitulative illustrée des panneaux de signalisation à connaître pour l'examen du Code de la Route.",
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      chapter_id: "00000000-0000-0000-0000-000000000012",
      course_id: "00000000-0000-0000-0000-000000000002",
      title: "Cours Vidéo : Franchissement d'un Rond-Point",
      lesson_type: "video",
      duration: 420,
      order_index: 0,
      is_published: true,
      content: "Comment insérer votre véhicule dans un carrefour à sens giratoire en respectant les règles de priorité et les clignotants.",
    },
    {
      id: "00000000-0000-0000-0000-000000000105",
      chapter_id: "00000000-0000-0000-0000-000000000012",
      course_id: "00000000-0000-0000-0000-000000000002",
      title: "Podcast Audio : Les 5 erreurs fatales en intersection",
      lesson_type: "audio",
      duration: 360,
      order_index: 1,
      is_published: true,
      content: "Analyse audio des fautes éliminatoires les plus courantes commises aux intersections lors de l'examen de conduite.",
    },
  ];

  for (const l of lessons) {
    const { error: lErr } = await supabase.from("lessons").upsert(l, { onConflict: "id" });
    if (lErr) console.error("Error inserting lesson:", l.title, lErr.message);
    else console.log("✓ Lesson inserted/updated:", l.title);
  }

  console.log("Seeding complete!");
}

seedCourses();
