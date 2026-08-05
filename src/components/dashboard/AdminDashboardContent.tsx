"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  Users, CreditCard, BookOpen, GraduationCap, IdCard,
  TrendingUp, TrendingDown, ArrowRight, UserPlus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import Link from "next/link";
import type { Student } from "@/types/database";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, color, bgColor, href }: StatCardProps) {
  const content = (
    <Card className="stat-card cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

interface AdminDashboardContentProps {
  stats: {
    totalStudents: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    pendingStudents: number;
    totalCourses: number;
    totalExams: number;
    passedExams: number;
    totalPermits: number;
  };
  recentStudents: Student[];
  subscriptionsData: Array<{ id: string; status: string; plan: string; created_at: string }>;
}

export function AdminDashboardContent({ stats, recentStudents, subscriptionsData }: AdminDashboardContentProps) {
  const passRate = stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleDateString("fr-FR", { month: "short" });
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const inscriptions = subscriptionsData.filter(s => s.created_at?.startsWith(monthStr)).length;
    return { month, inscriptions, actifs: Math.floor(inscriptions * 0.75) };
  });

  const pieData = [
    { name: "Actifs", value: stats.activeSubscriptions, color: "#00C9A7" },
    { name: "Expirés", value: stats.expiredSubscriptions, color: "#EF4444" },
    { name: "En attente", value: stats.pendingStudents, color: "#F5A623" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-[#F5A623]/10 translate-y-1/2" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Bienvenue, Administrateur</h2>
          <p className="text-white/70">Gérez votre auto-école depuis un seul endroit.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total apprenants" value={stats.totalStudents} icon={Users} color="text-[#0A1628]" bgColor="bg-blue-100 dark:bg-blue-900/30" href="/admin/inscriptions" />
        <StatCard title="Abonnements actifs" value={stats.activeSubscriptions} icon={CreditCard} color="text-[#00C9A7]" bgColor="bg-green-100 dark:bg-green-900/30" href="/admin/abonnements" />
        <StatCard title="Taux de réussite" value={`${passRate}%`} icon={GraduationCap} color="text-[#F5A623]" bgColor="bg-yellow-100 dark:bg-yellow-900/30" />
        <StatCard title="Permis enregistrés" value={stats.totalPermits} icon={IdCard} color="text-purple-600" bgColor="bg-purple-100 dark:bg-purple-900/30" href="/admin/permis" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des abonnements</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="inscriptions" stroke="#0A1628" strokeWidth={2} dot={{ fill: "#F5A623", strokeWidth: 2 }} name="Abonnements" />
                <Line type="monotone" dataKey="actifs" stroke="#00C9A7" strokeWidth={2} dot={false} name="Actifs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statut abonnements</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dernières inscriptions</CardTitle>
              <CardDescription>Apprenants récemment inscrits</CardDescription>
            </div>
            <Link href="/admin/inscriptions">
              <Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun apprenant inscrit</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#0A1628] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{student.matricule}</p>
                    </div>
                    <span className={`badge text-[10px] ${getStatusColor(student.status)}`}>{getStatusLabel(student.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Raccourcis vers les fonctions principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/inscriptions", icon: UserPlus, label: "Nouvel apprenant", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { href: "/admin/abonnements", icon: CreditCard, label: "Abonnements", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
              { href: "/admin/cours", icon: BookOpen, label: "Gérer les cours", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { href: "/admin/permis", icon: IdCard, label: "Permis délivrés", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
              { href: "/admin/examens", icon: GraduationCap, label: "Examens blancs", color: "text-[#F5A623]", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
              { href: "/admin/statistiques", icon: TrendingUp, label: "Statistiques", color: "text-[#00C9A7]", bg: "bg-teal-50 dark:bg-teal-900/20" },
            ].map(({ href, icon: Icon, label, color, bg }) => (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${bg} hover:opacity-90 transition-opacity cursor-pointer`}>
                  <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
