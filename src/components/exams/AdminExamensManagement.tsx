"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, Search, CheckCircle, XCircle,
  TrendingUp, Users, Calendar, Award,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

interface ExamSession {
  id: string;
  student_id: string;
  score: number | null;
  is_passed: boolean;
  started_at: string;
  completed_at?: string;
  students?: { id: string; first_name: string; last_name: string; matricule: string; email?: string } | null;
}

interface AdminExamensManagementProps {
  sessions: ExamSession[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    thisWeek: number;
  };
}

const PAGE_SIZE = 15;

export function AdminExamensManagement({ sessions, stats }: AdminExamensManagementProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  // Weekly trend (last 6 weeks)
  const weeklyData = Array.from({ length: 6 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const label = `S-${5 - i}`;
    const weekSessions = sessions.filter(s => {
      const d = new Date(s.started_at);
      return d >= start && d <= end;
    });
    const passed = weekSessions.filter(s => s.is_passed).length;
    const rate = weekSessions.length > 0 ? Math.round((passed / weekSessions.length) * 100) : 0;
    return { label, sessions: weekSessions.length, rate };
  }).reverse();

  // Score distribution
  const distribution = [
    { range: "0-19%", count: 0, color: "#EF4444" },
    { range: "20-39%", count: 0, color: "#F97316" },
    { range: "40-59%", count: 0, color: "#F5A623" },
    { range: "60-79%", count: 0, color: "#84CC16" },
    { range: "80-100%", count: 0, color: "#00C9A7" },
  ];
  sessions.forEach(s => {
    if (s.score === null) return;
    if (s.score < 20) distribution[0].count++;
    else if (s.score < 40) distribution[1].count++;
    else if (s.score < 60) distribution[2].count++;
    else if (s.score < 80) distribution[3].count++;
    else distribution[4].count++;
  });

  const filtered = sessions.filter(s => {
    const name = `${s.students?.first_name || ""} ${s.students?.last_name || ""}`.toLowerCase();
    const mat = (s.students?.matricule || "").toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || name.includes(q) || mat.includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "passed" ? s.is_passed :
      filter === "failed" ? (!s.is_passed && s.score !== null) : true;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-[#F5A623]" />
          Examens Blancs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{stats.total} session(s) enregistrée(s)</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total sessions", value: stats.total, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Taux de réussite", value: `${passRate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Score moyen", value: `${stats.avgScore}%`, icon: Award, color: "text-[#F5A623]", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Cette semaine", value: stats.thisWeek, icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution hebdomadaire</CardTitle>
            <CardDescription>Sessions et taux de réussite</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="sessions" stroke="#0A1628" strokeWidth={2} name="Sessions" dot={{ fill: "#0A1628" }} />
                <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#F5A623" strokeWidth={2} name="Réussite" dot={{ fill: "#F5A623" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des scores</CardTitle>
            <CardDescription>Distribution par tranche</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [v, "Apprenants"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Apprenants">
                  {distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, matricule..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Résultat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les résultats</SelectItem>
            <SelectItem value="passed">Réussis uniquement</SelectItem>
            <SelectItem value="failed">Échoués uniquement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Apprenant</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Aucune session d'examen trouvée</p>
                  </td>
                </tr>
              ) : paginated.map(s => (
                <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0A1628] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(s.students?.first_name?.[0] || "?")}{ (s.students?.last_name?.[0] || "")}
                      </div>
                      <div>
                        <p className="font-medium">{s.students?.first_name} {s.students?.last_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.students?.matricule}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(s.started_at)}</td>
                  <td className="py-3 px-4">
                    {s.score !== null ? (
                      <span className={`font-bold text-base ${s.score >= 70 ? "text-green-600" : s.score >= 50 ? "text-[#F5A623]" : "text-red-500"}`}>
                        {s.score}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {s.score !== null ? (
                      <div className="flex items-center gap-1.5">
                        {s.is_passed
                          ? <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-green-600 font-medium text-xs">Réussi</span></>
                          : <><XCircle className="h-4 w-4 text-red-500" /><span className="text-red-500 font-medium text-xs">Échoué</span></>}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">En cours</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">{filtered.length} session(s) · Page {page}/{totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
