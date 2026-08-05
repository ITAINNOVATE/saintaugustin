"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  Car,
  Search,
  CheckCircle2,
  Award,
  Calendar,
  User,
  Star,
  FileCheck,
  Plus,
  Clock,
} from "lucide-react";
import type { Student, DrivingEvaluation, GradeRating } from "@/types/database";

interface MoniteurEvaluationsProps {
  students: Student[];
  initialEvaluations: DrivingEvaluation[];
  instructorId: string;
}

const RUBRICS = [
  { group: "Marche Lente (ML)", items: [
    { key: "ml1", label: "ML1 — Démarrage & allure lente" },
    { key: "ml2", label: "ML2 — Maintien de la trajectoire lente" },
    { key: "ml3", label: "ML3 — Maîtrise des pédales & embrayage" }
  ]},
  { group: "Rangement / Créneau (R)", items: [
    { key: "r1", label: "R1 — Rangement en bataille" },
    { key: "r2", label: "R2 — Rangement en créneau" },
    { key: "r3", label: "R3 — Rangement en épi" }
  ]},
  { group: "Slalom / Zig-Zag", items: [
    { key: "zigzag1", label: "ZigZag1 — Slalom à vitesse modérée" },
    { key: "zigzag2", label: "ZigZag2 — Précision des virages courts" },
    { key: "zigzag3", label: "ZigZag3 — Stabilité & évitement" }
  ]},
  { group: "Conduite en Circulation (CR)", items: [
    { key: "cr1", label: "CR1 — Respect du code & signalisation" },
    { key: "cr2", label: "CR2 — Contrôle des rétroviseurs & angles morts" },
    { key: "cr3", label: "CR3 — Insertion & courtoisie au volant" }
  ]}
];

const RATINGS: { value: GradeRating; label: string; color: string; bg: string }[] = [
  { value: "Médiocre", label: "Médiocre", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/60 border-red-300" },
  { value: "Passable", label: "Passable", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/60 border-orange-300" },
  { value: "Bien", label: "Bien", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300" },
  { value: "Très Bien", label: "Très Bien", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950/60 border-green-300" },
];

export function MoniteurEvaluations({ students, initialEvaluations, instructorId }: MoniteurEvaluationsProps) {
  const [evaluations, setEvaluations] = useState<DrivingEvaluation[]>(initialEvaluations);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  // Form state for 12 rubrics
  const [grades, setGrades] = useState<Record<string, GradeRating>>({
    ml1: "Passable", ml2: "Passable", ml3: "Passable",
    r1: "Passable", r2: "Passable", r3: "Passable",
    zigzag1: "Passable", zigzag2: "Passable", zigzag3: "Passable",
    cr1: "Passable", cr2: "Passable", cr3: "Passable",
  });
  const [comments, setComments] = useState("");

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return !q || name.includes(q) || s.matricule.toLowerCase().includes(q);
  });

  const handleOpenEvaluation = (student: Student) => {
    setSelectedStudent(student);
    // Pre-fill existing evaluation if available
    const existing = evaluations.find(e => e.student_id === student.id);
    if (existing) {
      setGrades({
        ml1: existing.ml1 || "Passable", ml2: existing.ml2 || "Passable", ml3: existing.ml3 || "Passable",
        r1: existing.r1 || "Passable", r2: existing.r2 || "Passable", r3: existing.r3 || "Passable",
        zigzag1: existing.zigzag1 || "Passable", zigzag2: existing.zigzag2 || "Passable", zigzag3: existing.zigzag3 || "Passable",
        cr1: existing.cr1 || "Passable", cr2: existing.cr2 || "Passable", cr3: existing.cr3 || "Passable",
      });
      setComments(existing.comments || "");
    } else {
      setGrades({
        ml1: "Passable", ml2: "Passable", ml3: "Passable",
        r1: "Passable", r2: "Passable", r3: "Passable",
        zigzag1: "Passable", zigzag2: "Passable", zigzag3: "Passable",
        cr1: "Passable", cr2: "Passable", cr3: "Passable",
      });
      setComments("");
    }
    setShowEvalDialog(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    startTransition(async () => {
      const payload = {
        student_id: selectedStudent.id,
        instructor_id: instructorId,
        evaluation_date: new Date().toISOString().split("T")[0],
        ...grades,
        comments,
      };

      const { data, error } = await supabase
        .from("driving_evaluations")
        .upsert(payload as any)
        .select("*, students(id, first_name, last_name, matricule)")
        .single();

      if (!error) {
        const updatedEval = (data as any) || {
          ...payload,
          id: `demo-eval-${Date.now()}`,
          created_at: new Date().toISOString(),
          students: selectedStudent,
        };

        setEvaluations(prev => {
          const idx = prev.findIndex(e => e.student_id === selectedStudent.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedEval;
            return copy;
          }
          return [updatedEval, ...prev];
        });

        toast({
          title: "Évaluation de conduite enregistrée !",
          description: `Les notes de ${selectedStudent.first_name} ${selectedStudent.last_name} ont été mises à jour.`,
        });
        setShowEvalDialog(false);
      } else {
        // Demo fallback
        const updatedEval: DrivingEvaluation = {
          id: `demo-eval-${Date.now()}`,
          student_id: selectedStudent.id,
          instructor_id: instructorId,
          evaluation_date: new Date().toISOString().split("T")[0],
          ...grades,
          comments,
          created_at: new Date().toISOString(),
          students: selectedStudent,
        };
        setEvaluations(prev => [updatedEval, ...prev.filter(e => e.student_id !== selectedStudent.id)]);
        toast({
          title: "Évaluation enregistrée (Mode Démo) !",
          description: `Notes mises à jour pour ${selectedStudent.first_name} ${selectedStudent.last_name}.`,
        });
        setShowEvalDialog(false);
      }
    });
  };

  const getStudentEvaluation = (studentId: string) => {
    return evaluations.find(e => e.student_id === studentId);
  };

  const getRatingBadge = (rating?: GradeRating) => {
    const r = RATINGS.find(x => x.value === rating) || RATINGS[1];
    return (
      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${r.bg} ${r.color}`}>
        {r.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-[#F5A623]" /> Évaluations de Conduite Pratique
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Évaluez la maîtrise technique des apprenants sur les 12 rubriques officielles
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Apprenants", val: students.length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Apprenants Évalués", val: evaluations.length, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "En Attente", val: Math.max(0, students.length - evaluations.length), color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Rubriques Notées", val: "12 / 12", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map((st) => (
          <Card key={st.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center`}>
                <FileCheck className={`h-5 w-5 ${st.color}`} />
              </div>
              <div>
                <p className="text-xl font-extrabold">{st.val}</p>
                <p className="text-xs text-muted-foreground">{st.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou matricule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Students Evaluation List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Aucun apprenant trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((st) => {
            const ev = getStudentEvaluation(st.id);
            return (
              <Card key={st.id} className="overflow-hidden hover:border-[#F5A623] transition-all">
                <CardHeader className="p-4 bg-muted/40 border-b flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A1628] text-white flex items-center justify-center font-bold text-sm">
                      {st.first_name[0]}{st.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{st.first_name} {st.last_name}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{st.matricule}</p>
                    </div>
                  </div>
                  {ev ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[11px] font-bold">
                      ✓ Évalué
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                      En attente
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {ev ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded-xl">
                        <div><span className="text-muted-foreground">ML (Marche Lente):</span> {getRatingBadge(ev.ml1)}</div>
                        <div><span className="text-muted-foreground">R (Créneau):</span> {getRatingBadge(ev.r1)}</div>
                        <div><span className="text-muted-foreground">ZigZag:</span> {getRatingBadge(ev.zigzag1)}</div>
                        <div><span className="text-muted-foreground">CR (Circulation):</span> {getRatingBadge(ev.cr1)}</div>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Évalué le {formatDate(ev.evaluation_date)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      Aucune évaluation de conduite enregistrée pour cet apprenant.
                    </p>
                  )}

                  <Button
                    onClick={() => handleOpenEvaluation(st)}
                    className="w-full bg-[#0A1628] text-white hover:bg-[#1E4070] font-bold rounded-xl text-xs gap-2"
                  >
                    <Star className="h-3.5 w-3.5 text-[#F5A623]" />
                    {ev ? "Modifier l'Évaluation" : "Évaluer cet Apprenant"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* EVALUATION FORM DIALOG */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Car className="h-5 w-5 text-[#F5A623]" />
              Évaluation Conduite — {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-mono">
              Matricule : {selectedStudent?.matricule}
            </p>
          </DialogHeader>

          <form onSubmit={handleSaveEvaluation} className="space-y-6 mt-4">
            {/* 12 Rubrics Grid */}
            <div className="space-y-6">
              {RUBRICS.map((group) => (
                <div key={group.group} className="space-y-3 p-4 bg-muted/30 border rounded-2xl">
                  <h3 className="font-bold text-sm text-[#F5A623] border-b pb-1">
                    {group.group}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <Label className="text-xs font-semibold text-foreground flex-1">
                          {item.label}
                        </Label>

                        {/* 4 Grade Options Pills */}
                        <div className="flex items-center gap-1">
                          {RATINGS.map((r) => {
                            const isSelected = grades[item.key] === r.value;
                            return (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => setGrades({ ...grades, [item.key]: r.value })}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all border cursor-pointer ${
                                  isSelected
                                    ? `${r.bg} ${r.color} ring-2 ring-offset-1 ring-[#F5A623]`
                                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">Remarques & Recommandations du Moniteur</Label>
              <Textarea
                id="comments"
                rows={3}
                placeholder="Indiquez vos conseils de conduite pour l'apprenant (ex: Améliorer les contrôles de rétroviseur)..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="text-sm rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEvalDialog(false)} className="rounded-xl">
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-extrabold rounded-xl px-6">
                {isPending ? "Enregistrement..." : "Valider l'Évaluation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
