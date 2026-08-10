import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardContent } from "@/components/dashboard/AdminDashboardContent";

export const metadata = { title: "Tableau de bord Administrateur | Auto École Saint Augustin" };

export default async function AdminDashboardPage() {
  let user: any = null;
  let profile = { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };
  let studentsData: any[] = [];
  let subsData: any[] = [];
  let coursesData: any[] = [];
  let examsData: any[] = [];
  let permitsData: any[] = [];
  let progressData: any[] = [];
  let notificationCount = 0;

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

    try { studentsData = (await supabase.from("students").select("id, first_name, last_name, matricule, status, created_at")).data || []; } catch {}
    try { subsData = (await supabase.from("subscriptions").select("id, status, plan, created_at")).data || []; } catch {}
    try { coursesData = (await supabase.from("courses").select("id, title, is_published, chapters(id, lessons(id))")).data || []; } catch {}
    try { examsData = (await supabase.from("exam_sessions").select("id, student_id, score, is_passed, started_at, students(id, first_name, last_name, matricule)")).data || []; } catch {}
    try { permitsData = (await supabase.from("learner_permits").select("id, created_at")).data || []; } catch {}
    try { progressData = (await supabase.from("lesson_progress").select("id, student_id, lesson_id, completed, completed_at")).data || []; } catch {}
    try {
      if (user) {
        const r: any = await supabase.from("notifications").select("id").eq("user_id", user.id).eq("is_read", false);
        notificationCount = r?.data?.length || 0;
      }
    } catch {}
  } catch {}

  const stats = {
    totalStudents: studentsData.length,
    activeSubscriptions: subsData.filter((s: any) => s.status === "active").length,
    expiredSubscriptions: subsData.filter((s: any) => s.status === "expired").length,
    pendingStudents: studentsData.filter((s: any) => s.status === "pending").length,
    totalCourses: coursesData.length,
    publishedCourses: coursesData.filter((c: any) => c.is_published).length,
    totalExams: examsData.length,
    passedExams: examsData.filter((e: any) => e.is_passed).length,
    totalPermits: permitsData.length,
  };

  const totalLessons = coursesData.reduce((acc: number, c: any) =>
    acc + (c.chapters || []).reduce((a: number, ch: any) => a + (ch.lessons?.length || 0), 0), 0);

  const studentProgress = studentsData.slice(0, 20).map((s: any) => {
    const completedLessons = progressData.filter((p: any) => p.student_id === s.id && p.completed).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const studentExams = examsData.filter((e: any) => e.student_id === s.id);
    const avgScore = studentExams.length > 0
      ? Math.round(studentExams.reduce((a: number, e: any) => a + (e.score || 0), 0) / studentExams.length)
      : null;
    const lastExam = [...studentExams].sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    return {
      id: s.id, name: `${s.first_name} ${s.last_name}`, matricule: s.matricule, status: s.status,
      progressPct, completedLessons, totalExams: studentExams.length,
      avgScore, lastScore: lastExam?.score ?? null, lastExamPassed: lastExam?.is_passed ?? null,
    };
  });

  return (
    <DashboardLayout
      userRole="admin"
      userName={`${profile.first_name} ${profile.last_name}`}
      userEmail={user?.email || "admin@saintaugustin.com"}
      pageTitle="Tableau de bord"
      notificationCount={notificationCount}
    >
      <AdminDashboardContent
        stats={stats}
        recentStudents={studentsData.slice(0, 5)}
        subscriptionsData={subsData}
        studentProgress={studentProgress}
        totalLessons={totalLessons}
      />
    </DashboardLayout>
  );
}
