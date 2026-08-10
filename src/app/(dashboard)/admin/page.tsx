import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminDashboardContent } from "@/components/dashboard/AdminDashboardContent";

export const metadata = { title: "Tableau de bord Administrateur | Auto École Saint Augustin" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profileRes: any = await supabase.from("profiles").select("*").eq("id", user?.id || "").single();
  const profile = profileRes?.data || { first_name: "Administrateur", last_name: "Saint Augustin", role: "admin" };

  let studentsResult: any = { data: [] };
  let subsResult: any = { data: [] };
  let coursesResult: any = { data: [] };
  let examsResult: any = { data: [] };
  let permitsResult: any = { data: [] };
  let progressResult: any = { data: [] };

  try {
    const results = await Promise.all([
      supabase.from("students").select("id, first_name, last_name, matricule, status, created_at") as any,
      supabase.from("subscriptions").select("id, status, plan, created_at") as any,
      supabase.from("courses").select("id, title, is_published, chapters(id, lessons(id))") as any,
      supabase.from("exam_sessions").select("id, student_id, score, is_passed, started_at, students(id, first_name, last_name, matricule)") as any,
      supabase.from("learner_permits").select("id, created_at") as any,
      supabase.from("lesson_progress").select("id, student_id, lesson_id, completed, completed_at") as any,
    ]);
    studentsResult = results[0];
    subsResult = results[1];
    coursesResult = results[2];
    examsResult = results[3];
    permitsResult = results[4];
    progressResult = results[5];
  } catch {}

  const stats = {
    totalStudents: studentsResult.data?.length || 0,
    activeSubscriptions: subsResult.data?.filter((s: any) => s.status === "active").length || 0,
    expiredSubscriptions: subsResult.data?.filter((s: any) => s.status === "expired").length || 0,
    pendingStudents: studentsResult.data?.filter((s: any) => s.status === "pending").length || 0,
    totalCourses: coursesResult.data?.length || 0,
    publishedCourses: coursesResult.data?.filter((c: any) => c.is_published).length || 0,
    totalExams: examsResult.data?.length || 0,
    passedExams: examsResult.data?.filter((e: any) => e.is_passed).length || 0,
    totalPermits: permitsResult.data?.length || 0,
  };

  // Build student progress data
  const students: any[] = studentsResult.data || [];
  const examSessions: any[] = examsResult.data || [];
  const lessonProgress: any[] = progressResult.data || [];
  const courses: any[] = coursesResult.data || [];

  // Total lessons across all courses
  const totalLessons = courses.reduce((acc: number, c: any) => {
    return acc + (c.chapters || []).reduce((a: number, ch: any) => a + (ch.lessons?.length || 0), 0);
  }, 0);

  const studentProgress = students.slice(0, 20).map((s: any) => {
    const completedLessons = lessonProgress.filter((p: any) => p.student_id === s.id && p.completed).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const studentExams = examSessions.filter((e: any) => e.student_id === s.id);
    const avgScore = studentExams.length > 0
      ? Math.round(studentExams.reduce((a: number, e: any) => a + (e.score || 0), 0) / studentExams.length)
      : null;
    const lastExam = studentExams.sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
    return {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      matricule: s.matricule,
      status: s.status,
      progressPct,
      completedLessons,
      totalExams: studentExams.length,
      avgScore,
      lastScore: lastExam?.score ?? null,
      lastExamPassed: lastExam?.is_passed ?? null,
    };
  });

  const recentStudents = students.slice(0, 5);

  let notificationCount = 0;
  try {
    if (user) {
      const notifRes: any = await supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5);
      notificationCount = notifRes?.data?.length || 0;
    }
  } catch {}

  return (
    <DashboardLayout
      userRole="admin"
      userName={`${profile.first_name} ${profile.last_name}`}
      userEmail={user?.email || "admin@saintaugustin.bj"}
      pageTitle="Tableau de bord"
      notificationCount={notificationCount}
    >
      <AdminDashboardContent
        stats={stats}
        recentStudents={recentStudents}
        subscriptionsData={subsResult.data || []}
        studentProgress={studentProgress}
        totalLessons={totalLessons}
      />
    </DashboardLayout>
  );
}
