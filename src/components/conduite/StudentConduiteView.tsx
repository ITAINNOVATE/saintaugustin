"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Car, Award, Calendar, CheckCircle2, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { DrivingEvaluation, GradeRating } from "@/types/database";

interface StudentConduiteViewProps {
  evaluation: DrivingEvaluation | null;
  studentName: string;
  matricule: string;
}

const RUBRIC_GROUPS = [
  {
    title: "Marche Lente (ML)",
    items: [
      { key: "ml1", name: "ML1", label: "Démarrage & allure lente" },
      { key: "ml2", name: "ML2", label: "Maintien de la trajectoire lente" },
      { key: "ml3", name: "ML3", label: "Maîtrise des pédales & embrayage" },
    ],
  },
  {
    title: "Rangement / Créneau (R)",
    items: [
      { key: "r1", name: "R1", label: "Rangement en bataille" },
      { key: "r2", name: "R2", label: "Rangement en créneau" },
      { key: "r3", name: "R3", label: "Rangement en épi" },
    ],
  },
  {
    title: "Slalom / Zig-Zag",
    items: [
      { key: "zigzag1", name: "ZigZag1", label: "Slalom à vitesse modérée" },
      { key: "zigzag2", name: "ZigZag2", label: "Virages courts serrés" },
      { key: "zigzag3", name: "ZigZag3", label: "Stabilité & évitement" },
    ],
  },
  {
    title: "Conduite en Circulation (CR)",
    items: [
      { key: "cr1", name: "CR1", label: "Respect du code & signalisation" },
      { key: "cr2", name: "CR2", label: "Rétroviseurs & angles morts" },
      { key: "cr3", name: "CR3", label: "Insertion & courtoisie" },
    ],
  },
];

const GRADE_STYLES: Record<GradeRating, { color: string; bg: string; border: string }> = {
  Médiocre: { color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/60", border: "border-red-300" },
  Passable: { color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/60", border: "border-orange-300" },
  Bien: { color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/60", border: "border-blue-300" },
  "Très Bien": { color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950/60", border: "border-green-300" },
};

export function StudentConduiteView({ evaluation, studentName, matricule }: StudentConduiteViewProps) {
  // Compute global score percentage from grades
  const getRatingPoints = (r?: GradeRating) => {
    if (r === "Très Bien") return 4;
    if (r === "Bien") return 3;
    if (r === "Passable") return 2;
    if (r === "Médiocre") return 1;
    return 0;
  };

  let totalPoints = 0;
  let totalRubrics = 0;

  if (evaluation) {
    const keys = ["ml1", "ml2", "ml3", "r1", "r2", "r3", "zigzag1", "zigzag2", "zigzag3", "cr1", "cr2", "cr3"];
    keys.forEach((k) => {
      const val = (evaluation as any)[k] as GradeRating | undefined;
      if (val) {
        totalPoints += getRatingPoints(val);
        totalRubrics++;
      }
    });
  }

  const globalPercent = totalRubrics > 0 ? Math.round((totalPoints / (totalRubrics * 4)) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Read-only Alert Header */}
      <div className="p-4 bg-[#0A1628] text-white rounded-2xl flex items-center justify-between shadow-md border border-[#0A1628]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5A623] text-[#0A1628] flex items-center justify-center font-bold">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
              Espace Apprenant • Mode Consultation
            </span>
            <h1 className="text-xl font-bold">Mon Carnet d&apos;Évaluation de Conduite</h1>
          </div>
        </div>

        <Badge variant="outline" className="border-white/30 text-white text-xs font-semibold px-3 py-1">
          🔒 Lecture Seule
        </Badge>
      </div>

      {/* Main Scorecard Card */}
      {!evaluation ? (
        <Card className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
          <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h2 className="text-lg font-bold text-foreground mb-1">Aucune évaluation enregistrée</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Votre moniteur de conduite n&apos;a pas encore attribué vos notes pratiques. Vos résultats s&apos;afficheront automatiquement ici après votre première séance de conduite.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Banner */}
          <Card className="overflow-hidden border-2 border-[#F5A623] bg-gradient-to-r from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white shadow-xl rounded-3xl">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <Badge className="bg-[#F5A623] text-[#0A1628] font-extrabold text-xs px-3 py-1 rounded-full uppercase">
                  Maîtrise Globale du Véhicule
                </Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold">{studentName}</h2>
                <p className="text-white/80 text-xs font-mono">
                  Matricule : {matricule} • Évalué le {formatDate(evaluation.evaluation_date)}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[160px]">
                <p className="text-xs uppercase font-bold text-[#F5A623]">Niveau Pratique</p>
                <p className="text-4xl font-extrabold my-1">{globalPercent}%</p>
                <Progress value={globalPercent} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>

          {/* 12 Rubrics Grid Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RUBRIC_GROUPS.map((group) => (
              <Card key={group.title} className="border-2 border-border rounded-2xl overflow-hidden">
                <CardHeader className="p-4 bg-muted/40 border-b">
                  <CardTitle className="text-sm font-bold text-[#F5A623] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {group.items.map((item) => {
                    const grade = (evaluation as any)[item.key] as GradeRating | undefined;
                    const style = grade ? GRADE_STYLES[grade] : GRADE_STYLES["Passable"];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-2 p-2.5 bg-muted/30 border rounded-xl"
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{item.label}</p>
                        </div>

                        {grade ? (
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${style.bg} ${style.color} ${style.border}`}
                          >
                            {grade}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Non noté</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Instructor Comments */}
          {evaluation.comments && (
            <Card className="p-5 border-2 border-border rounded-2xl bg-amber-50/50 dark:bg-amber-950/20">
              <h3 className="font-bold text-sm text-[#F5A623] mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" /> Remarques & Conseils de votre Moniteur :
              </h3>
              <p className="text-sm text-foreground leading-relaxed italic font-medium">
                « {evaluation.comments} »
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
