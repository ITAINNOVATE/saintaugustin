"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { Users, CreditCard, BookOpen, GraduationCap, IdCard, ClipboardCheck, TrendingUp, Download } from "lucide-react";

interface StatistiquesDashboardProps {
  studentsData: any[];
  subscriptionsData: any[];
  coursesData: any[];
  examsData: any[];
  permitsData: any[];
  exercisesData: any[];
}

const COLORS = ["#0A1628", "#F5A623", "#00C9A7", "#6366F1", "#EF4444"];

function buildMonthlyData(items: any[], dateField: string, months = 12) {
  return Array.from({ length: months }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - 1 - i));
    const label = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month: label, count: items.filter(d => (d[dateField] || "").startsWith(prefix)).length };
  });
}

export function StatistiquesDashboard({ studentsData, subscriptionsData, coursesData, examsData, permitsData, exercisesData }: StatistiquesDashboardProps) {
  const [period, setPeriod] = useState<"6" | "12">("6");
  const months = parseInt(period);

  const passRate = examsData.length > 0 ? Math.round((examsData.filter(e => e.is_passed).length / examsData.length) * 100) : 0;
  const totalRevenue = subscriptionsData.filter(s => s.status === "active").reduce((acc, s) => acc + (s.amount || 0), 0);

  const kpis = [
    { label: "Total inscrits", value: studentsData.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Abonnements actifs", value: subscriptionsData.filter(s => s.status === "active").length, icon: CreditCard, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Abonnements expirés", value: subscriptionsData.filter(s => s.status === "expired").length, icon: CreditCard, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
    { label: "Cours publiés", value: coursesData.filter(c => c.is_published).length, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Examens composés", value: examsData.length, icon: GraduationCap, color: "text-[#F5A623]", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "Taux de réussite", value: `${passRate}%`, icon: TrendingUp, color: "text-[#00C9A7]", bg: "bg-teal-50 dark:bg-teal-900/20" },
    { label: "Permis enregistrés", value: permitsData.length, icon: IdCard, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Exercices réalisés", value: exercisesData.length, icon: ClipboardCheck, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  const inscriptionsData = buildMonthlyData(studentsData, "created_at", months);
  const abonnementsData = buildMonthlyData(subscriptionsData, "created_at", months);
  const examsMonthly = buildMonthlyData(examsData, "started_at", months);

  const planPieData = [
    { name: "1 Mois", value: subscriptionsData.filter(s => s.plan === "1_mois").length },
    { name: "3 Mois", value: subscriptionsData.filter(s => s.plan === "3_mois").length },
    { name: "6 Mois", value: subscriptionsData.filter(s => s.plan === "6_mois").length },
  ].filter(d => d.value > 0);

  const statusPieData = [
    { name: "Validés", value: studentsData.filter(s => s.status === "validated").length },
    { name: "En attente", value: studentsData.filter(s => s.status === "pending").length },
    { name: "Archivés", value: studentsData.filter(s => s.status === "archived").length },
  ].filter(d => d.value > 0);

  const handleExportCSV = () => {
    const rows = [
      ["Indicateur", "Valeur"],
      ["Total inscrits", studentsData.length],
      ["Abonnements actifs", subscriptionsData.filter(s => s.status === "active").length],
      ["Abonnements expirés", subscriptionsData.filter(s => s.status === "expired").length],
      ["Cours publiés", coursesData.filter(c => c.is_published).length],
      ["Examens composés", examsData.length],
      ["Taux de réussite", `${passRate}%`],
      ["Permis enregistrés", permitsData.length],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `statistiques-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Statistiques</h1><p className="text-muted-foreground text-sm">Vue d'ensemble de la plateforme</p></div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setPeriod("6")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === "6" ? "bg-[#0A1628] text-white" : "bg-background text-muted-foreground"}`}>6 mois</button>
            <button onClick={() => setPeriod("12")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === "12" ? "bg-[#0A1628] text-white" : "bg-background text-muted-foreground"}`}>12 mois</button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2"><Download className="h-4 w-4" />Exporter CSV</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="inscriptions">
        <TabsList className="mb-4">
          <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          <TabsTrigger value="abonnements">Abonnements</TabsTrigger>
          <TabsTrigger value="examens">Examens</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
        </TabsList>

        <TabsContent value="inscriptions">
          <Card><CardHeader><CardTitle>Nouvelles inscriptions</CardTitle><CardDescription>Évolution sur {months} mois</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={inscriptionsData}>
                  <defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0A1628" stopOpacity={0.3}/><stop offset="95%" stopColor="#0A1628" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0A1628" fill="url(#grad1)" strokeWidth={2} name="Inscriptions" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abonnements">
          <Card><CardHeader><CardTitle>Évolution des abonnements</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={abonnementsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F5A623" radius={[4, 4, 0, 0]} name="Abonnements" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examens">
          <Card><CardHeader><CardTitle>Examens composés</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={examsMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#00C9A7" strokeWidth={2} dot={{ fill: "#00C9A7" }} name="Examens" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repartition">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle>Répartition des plans</CardTitle></CardHeader>
              <CardContent>
                {planPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={planPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {planPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip /><Legend /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8 text-muted-foreground text-sm">Aucune donnée</p>}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle>Statut des apprenants</CardTitle></CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip /><Legend /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8 text-muted-foreground text-sm">Aucune donnée</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
