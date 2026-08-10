"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  Users, CreditCard, BookOpen, GraduationCap, IdCard,
  TrendingUp, ArrowRight, UserPlus, CheckCircle, XCircle,
  Search, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import Link from "next/link";

interface StudentProgressRow {
  id: string;
  name: string;
  matricule: string;
  status: string;
  progressPct: number;
  completedLessons: number;
  totalExams: number;
  avgScore: number | null;
  lastScore: number | null;
  lastExamPassed: boolean | null;
}

interface AdminDashboardContentProps {
  stats: {
    totalStudents: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    pendingStudents: number;
    totalCourses: number;
    publishedCourses: number;
    totalExams: number;
    passedExams: number;
    totalPermits: number;
  };
  recentStudents: any[];
  subscriptionsData: Array<{ id: string; status: string; plan: string; created_at: string }>;
  studentProgress: StudentProgressRow[];
  totalLessons: number;
}

function StatCard({ title, value, icon: Icon, color, bgColor, href, sub }: any) {
  const content = (
    <Card className="stat-card cursor-pointer group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
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

function ProgressBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-green-500" : value >= 40 ? "bg-[#F5A623]" : "bg-red-400";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function AdminDashboardContent({ stats, recentStudents, subscriptionsData, studentProgress, totalLessons }: AdminDashboardContentProps) {
  const passRate = stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"progressPct" | "avgScore" | "totalExams">("progressPct");
  const [sortAsc, setSortAsc] = useState(false);

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

  // Top 8 students by avgScore for bar chart
  const barData = [...studentProgress]
    .filter(s => s.avgScore !== null)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
    .slice(0, 8)
    .map(s => ({ name: s.name.split(" ")[0], score: s.avgScore }));

  const filtered = studentProgress
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.matricule.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = (a as any)[sortKey] ?? -1;
      const vb = (b as any)[sortKey] ?? -1;
      return sortAsc ? va - vb : vb - va;
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? (sortAsc ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 rounded-full bg-[#F5A623]/10 translate-y-1/2" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Tableau de bord Administrateur</h2>
          <p className="text-white/70">Gérez votre auto-école et suivez la progression de vos apprenants.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total apprenants" value={stats.totalStudents} icon={Users} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" href="/secretaire" />
        <StatCard title="Abonnements actifs" value={stats.activeSubscriptions} icon={CreditCard} color="text-[#00C9A7]" bgColor="bg-green-100 dark:bg-green-900/30" href="/admin/abonnements" sub={`${stats.expiredSubscriptions} expirés`} />
        <StatCard title="Cours publiés" value={`${stats.publishedCourses}/${stats.totalCourses}`} icon={BookOpen} color="text-purple-600" bgColor="bg-purple-100 dark:bg-purple-900/30" href="/admin/cours" />
        <StatCard title="Taux de réussite" value={`${passRate}%`} icon={GraduationCap} color="text-[#F5A623]" bgColor="bg-yellow-100 dark:bg-yellow-900/30" href="/admin/examens" sub={`${stats.passedExams}/${stats.totalExams} examens`} />
      </div>

      {/* Charts Row */}
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

      {/* Top scores bar chart */}
      {barData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Scores moyens aux examens</CardTitle>
              <CardDescription>Top 8 apprenants</CardDescription>
            </div>
            <Link href="/admin/examens">
              <Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(v: any) => [`${v}%`, "Score moyen"]} />
                <Bar dataKey="score" fill="#F5A623" radius={[4, 4, 0, 0]} name="Score moyen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Student Progress Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#F5A623]" />
              Suivi des Apprenants
            </CardTitle>
            <CardDescription>Progression cours + résultats examens</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Nom, matricule..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Link href="/admin/cours">
              <Button variant="outline" size="sm" className="gap-1"><BookOpen className="h-4 w-4" /> Cours</Button>
            </Link>
            <Link href="/admin/examens">
              <Button variant="outline" size="sm" className="gap-1"><GraduationCap className="h-4 w-4" /> Examens</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun apprenant trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Apprenant</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("progressPct")}>
                      Progression Cours <SortIcon k="progressPct" />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("totalExams")}>
                      Examens <SortIcon k="totalExams" />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort("avgScore")}>
                      Score moyen <SortIcon k="avgScore" />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Dernier examen</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0A1628] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{s.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-xs">
                            <span>{s.completedLessons}/{totalLessons} leçons</span>
                            <span className="font-semibold">{s.progressPct}%</span>
                          </div>
                          <ProgressBar value={s.progressPct} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{s.totalExams}</span>
                        <span className="text-muted-foreground text-xs ml-1">session{s.totalExams > 1 ? "s" : ""}</span>
                      </td>
                      <td className="py-3 px-4">
                        {s.avgScore !== null ? (
                          <span className={`font-bold text-base ${s.avgScore >= 70 ? "text-green-600" : s.avgScore >= 50 ? "text-[#F5A623]" : "text-red-500"}`}>
                            {s.avgScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.lastScore !== null ? (
                          <div className="flex items-center gap-1">
                            {s.lastExamPassed
                              ? <CheckCircle className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />}
                            <span className="font-medium">{s.lastScore}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Aucun</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Raccourcis vers les fonctions principales</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: "/secretaire", icon: UserPlus, label: "Gérer les apprenants", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { href: "/admin/abonnements", icon: CreditCard, label: "Abonnements", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            { href: "/admin/cours", icon: BookOpen, label: "Gérer les cours", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { href: "/admin/compositions", icon: IdCard, label: "Compositions", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { href: "/admin/examens", icon: GraduationCap, label: "Examens Blancs", color: "text-[#F5A623]", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { href: "/admin/statistiques", icon: TrendingUp, label: "Statistiques", color: "text-[#00C9A7]", bg: "bg-teal-50 dark:bg-teal-900/20" },
          ].map(({ href, icon: Icon, label, color, bg }) => (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 p-4 rounded-xl ${bg} hover:opacity-90 transition-opacity cursor-pointer`}>
                <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
