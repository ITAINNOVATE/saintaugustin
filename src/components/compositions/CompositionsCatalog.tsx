"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Clock,
  HelpCircle,
  Award,
  TrendingUp,
  RotateCcw,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  BarChart2,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { CompositionSubject, CompositionSession } from "@/types/database";

interface CompositionsCatalogProps {
  subjects: CompositionSubject[];
  userSessions: CompositionSession[];
  studentId: string;
}

export function CompositionsCatalog({ subjects, userSessions, studentId }: CompositionsCatalogProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Group sessions by subject_id
  const sessionsBySubject = userSessions.reduce((acc, s) => {
    if (!acc[s.subject_id]) acc[s.subject_id] = [];
    acc[s.subject_id].push(s);
    return acc;
  }, {} as Record<string, CompositionSession[]>);

  // Compute learner progression analytics
  const totalAttempts = userSessions.length;
  const passedAttempts = userSessions.filter((s) => s.is_passed).length;
  const avgSuccessRate = totalAttempts > 0
    ? Math.round(userSessions.reduce((acc, s) => acc + s.percentage, 0) / totalAttempts)
    : 0;

  const bestOverallScore = totalAttempts > 0
    ? Math.max(...userSessions.map((s) => s.score))
    : 0;

  // Filter subjects
  const filteredSubjects = subjects.filter((subj) => {
    const matchesSearch =
      !search ||
      subj.title.toLowerCase().includes(search.toLowerCase()) ||
      subj.permit_category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "all" || subj.permit_category === categoryFilter;

    const attempts = sessionsBySubject[subj.id] || [];
    let status = "À faire";
    if (attempts.length > 0) {
      status = attempts.some((a) => a.is_passed) ? "Terminé" : "En cours";
    }

    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getDifficultyBadge = (diff: string) => {
    if (diff === "Facile")
      return <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-400">Facile</Badge>;
    if (diff === "Difficile")
      return <Badge className="bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400">Difficile</Badge>;
    return <Badge className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400">Moyen</Badge>;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-[#F5A623]">
        <div className="space-y-2 text-center md:text-left">
          <Badge className="bg-[#F5A623] text-[#0A1628] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            📝 Espace de Composition Officiel
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold">E-Examen & Compositions Chronométrées</h1>
          <p className="text-white/80 text-sm max-w-xl leading-relaxed">
            Testez vos connaissances en conditions réelles d&apos;examen avec audio synchronisé, chronomètre et correction automatique instantanée.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-6 min-w-[240px]">
          <div className="text-center flex-1">
            <p className="text-[10px] uppercase font-bold text-[#F5A623]">Taux Moyen</p>
            <p className="text-3xl font-extrabold">{avgSuccessRate}%</p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center flex-1">
            <p className="text-[10px] uppercase font-bold text-green-400">Examens Réussis</p>
            <p className="text-3xl font-extrabold">{passedAttempts}</p>
          </div>
        </div>
      </div>

      {/* Analytics & Progression Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Analytics Card 1: Stats */}
        <Card className="border-2 border-border rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A1628] text-[#F5A623] flex items-center justify-center font-bold shadow-sm">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Meilleure Note Absolue</p>
              <p className="text-2xl font-extrabold text-foreground">{bestOverallScore} / 20</p>
              <p className="text-[11px] text-green-600 font-medium">Sur {totalAttempts} épreuves composées</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card 2: Chapitres à renforcer */}
        <Card className="border-2 border-border rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-semibold">Point d&apos;Attention</p>
              <p className="text-sm font-bold text-foreground truncate">Priorités & Carrefours</p>
              <p className="text-[11px] text-muted-foreground">Recommandé : Réviser le chapitre 2</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card 3: Recommandation IA */}
        <Card className="border-2 border-border rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00C9A7]/20 text-[#00C9A7] flex items-center justify-center font-bold">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Conseil Pédagogique</p>
              <p className="text-sm font-extrabold text-foreground">Composer le Sujet N°2</p>
              <p className="text-[11px] text-muted-foreground">Audio synchronisé disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un sujet de composition par titre ou catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40 rounded-2xl">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes Catégories</SelectItem>
              <SelectItem value="B">Permis B (Auto)</SelectItem>
              <SelectItem value="A">Permis A (Moto)</SelectItem>
              <SelectItem value="C">Permis C (Poids Lourd)</SelectItem>
              <SelectItem value="D">Permis D (Transport)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-2xl">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les Statuts</SelectItem>
              <SelectItem value="À faire">À faire</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-base">Aucun sujet de composition disponible</p>
            <p className="text-xs text-muted-foreground">Essayez de modifier vos filtres de recherche.</p>
          </Card>
        ) : (
          filteredSubjects.map((subj) => {
            const attempts = sessionsBySubject[subj.id] || [];
            const attemptCount = attempts.length;
            const bestAttempt = attemptCount > 0
              ? attempts.reduce((prev, curr) => (curr.score > prev.score ? curr : prev))
              : null;

            let statusLabel = "À faire";
            let statusBadge = (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 font-bold">
                À faire
              </Badge>
            );

            if (attemptCount > 0) {
              const isPassed = attempts.some((a) => a.is_passed);
              if (isPassed) {
                statusLabel = "Terminé";
                statusBadge = (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-400 font-bold">
                    ✓ Terminé (Réussi)
                  </Badge>
                );
              } else {
                statusLabel = "En cours";
                statusBadge = (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-400 font-bold">
                    ⏳ En cours
                  </Badge>
                );
              }
            }

            return (
              <Card
                key={subj.id}
                className="overflow-hidden border-2 border-border shadow-md rounded-3xl hover:border-[#F5A623] transition-all flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 bg-muted/40 border-b space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-[#0A1628] text-white dark:bg-[#F5A623] dark:text-[#0A1628] font-bold text-xs">
                      Permis {subj.permit_category}
                    </Badge>
                    {statusBadge}
                  </div>
                  <h3 className="font-extrabold text-lg leading-tight text-foreground">{subj.title}</h3>
                </div>

                {/* Body Specs */}
                <CardContent className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-muted/30 rounded-xl flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#F5A623]" />
                      <div>
                        <p className="text-muted-foreground text-[10px]">Durée</p>
                        <p className="font-bold">{subj.duration_minutes} minutes</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/30 rounded-xl flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-muted-foreground text-[10px]">Questions</p>
                        <p className="font-bold">{subj.total_questions} QCM</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/30 rounded-xl flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-muted-foreground text-[10px]">Difficulté</p>
                        {getDifficultyBadge(subj.difficulty)}
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/30 rounded-xl flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-muted-foreground text-[10px]">Tentatives</p>
                        <p className="font-bold">{attemptCount} essai(s)</p>
                      </div>
                    </div>
                  </div>

                  {/* Best score bar if attempted */}
                  {bestAttempt && (
                    <div className="p-3 bg-gradient-to-r from-muted/50 to-muted/80 rounded-2xl border space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Meilleure Note :</span>
                        <span className="font-extrabold text-[#0A1628] dark:text-[#F5A623]">
                          {bestAttempt.score} / {bestAttempt.total_questions} ({bestAttempt.percentage}%)
                        </span>
                      </div>
                      <Progress value={bestAttempt.percentage} className="h-2 rounded-full" />
                    </div>
                  )}
                </CardContent>

                {/* Footer Action */}
                <div className="p-5 border-t bg-muted/20">
                  <Link href={`/apprenant/compositions/${subj.id}`}>
                    <Button className="w-full bg-[#0A1628] text-white hover:bg-[#1E4070] font-extrabold rounded-2xl py-5 text-sm gap-2 shadow-sm">
                      <Play className="h-4 w-4 text-[#F5A623]" />
                      {attemptCount > 0 ? "Recommencer l'épreuve" : "Commencer la composition"}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Historique Récent des Compositions */}
      {userSessions.length > 0 && (
        <Card className="border-2 border-border rounded-3xl overflow-hidden shadow-lg mt-8">
          <CardHeader className="p-6 bg-muted/30 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#F5A623]" /> Historique de mes tentatives
            </CardTitle>
            <CardDescription className="text-xs">
              Retrouvez l&apos;ensemble de vos compositions passées et l&apos;évolution de vos notes.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-xs font-semibold text-muted-foreground text-left uppercase">
                  <th className="p-4">Date</th>
                  <th className="p-4">Sujet de Composition</th>
                  <th className="p-4">Score Obtenu</th>
                  <th className="p-4">Pourcentage</th>
                  <th className="p-4">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {formatDate(sess.completed_at || sess.started_at)}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {sess.subject?.title || "Sujet de Composition"}
                    </td>
                    <td className="p-4 font-extrabold text-[#0A1628] dark:text-[#F5A623]">
                      {sess.score} / {sess.total_questions}
                    </td>
                    <td className="p-4 font-semibold">{sess.percentage}%</td>
                    <td className="p-4">
                      {sess.is_passed ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-400 font-bold">
                          ✓ Réussi
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 font-bold">
                          ✕ Échoué
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
