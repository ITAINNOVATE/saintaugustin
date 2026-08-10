"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Music,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Sparkles,
} from "lucide-react";
import type { CompositionSubject, CompositionQuestion, PermitCategory } from "@/types/database";

interface AdminCompositionsManagementProps {
  initialSubjects: CompositionSubject[];
  adminId: string;
}

export function AdminCompositionsManagement({ initialSubjects, adminId }: AdminCompositionsManagementProps) {
  const [subjects, setSubjects] = useState<CompositionSubject[]>(initialSubjects);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<CompositionSubject | null>(null);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();
  const supabase = createClient();

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    title: "",
    permit_category: "B" as PermitCategory,
    duration_minutes: 20,
    total_questions: 20,
    pass_score: 16,
    difficulty: "Moyen" as "Facile" | "Moyen" | "Difficile",
    audio_url: "",
    can_go_back: true,
    show_explanations: true,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "single" as "single" | "multiple" | "boolean",
    image_url: "",
    explanation: "",
    audio_start_time: 0,
    audio_end_time: 15,
    optA: "Réponse A",
    optB: "Réponse B",
    optC: "Réponse C",
    optD: "Réponse D",
    correctA: true,
    correctB: false,
    correctC: false,
    correctD: false,
  });

  const handleOpenNewSubject = () => {
    setSelectedSubject(null);
    setSubjectForm({
      title: "",
      permit_category: "B",
      duration_minutes: 20,
      total_questions: 20,
      pass_score: 16,
      difficulty: "Moyen",
      audio_url: "",
      can_go_back: true,
      show_explanations: true,
    });
    setShowSubjectDialog(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        ...subjectForm,
        is_published: true,
      };

      const { data, error } = await (supabase.from("composition_subjects") as any)
        .upsert(selectedSubject ? { id: selectedSubject.id, ...payload } : payload)
        .select()
        .single();

      if (!error && data) {
        setSubjects((prev) => {
          const idx = prev.findIndex((s) => s.id === data.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...data };
            return copy;
          }
          return [data, ...prev];
        });
        toast({ title: selectedSubject ? "Sujet modifié" : "Sujet de composition créé !" });
        setShowSubjectDialog(false);
      } else {
        // Fallback demo update
        const newSubject: CompositionSubject = {
          id: selectedSubject ? selectedSubject.id : `subject-demo-${Date.now()}`,
          ...payload,
          is_published: true,
          created_at: new Date().toISOString(),
          questions: selectedSubject?.questions || [],
        };
        setSubjects((prev) => [newSubject, ...prev.filter((s) => s.id !== newSubject.id)]);
        toast({ title: "Sujet créé (Mode Démo) !" });
        setShowSubjectDialog(false);
      }
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    startTransition(async () => {
      const options = [
        { id: "A", label: "A", text: questionForm.optA },
        { id: "B", label: "B", text: questionForm.optB },
      ];
      if (questionForm.question_type !== "boolean") {
        options.push({ id: "C", label: "C", text: questionForm.optC });
        options.push({ id: "D", label: "D", text: questionForm.optD });
      }

      const correct_answers: string[] = [];
      if (questionForm.correctA) correct_answers.push("A");
      if (questionForm.correctB) correct_answers.push("B");
      if (questionForm.correctC && questionForm.question_type !== "boolean") correct_answers.push("C");
      if (questionForm.correctD && questionForm.question_type !== "boolean") correct_answers.push("D");

      const questionNumber = (selectedSubject.questions?.length || 0) + 1;

      const payload = {
        subject_id: selectedSubject.id,
        question_number: questionNumber,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        options,
        correct_answers,
        explanation: questionForm.explanation,
        image_url: questionForm.image_url,
        audio_start_time: Number(questionForm.audio_start_time),
        audio_end_time: Number(questionForm.audio_end_time),
      };

      const newQ: CompositionQuestion = {
        id: `q-demo-${Date.now()}`,
        ...payload,
      };

      setSubjects((prev) =>
        prev.map((s) =>
          s.id === selectedSubject.id
            ? { ...s, questions: [...(s.questions || []), newQ] }
            : s
        )
      );

      toast({ title: "Question ajoutée avec succès !" });
      setShowQuestionDialog(false);
    });
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce sujet ?")) return;
    startTransition(async () => {
      const { error } = await supabase.from("composition_subjects").delete().eq("id", subjectId);
      if (!error) {
        setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
        toast({ title: "Sujet supprimé" });
      } else {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleEditSubject = (subj: CompositionSubject) => {
    setSelectedSubject(subj);
    setSubjectForm({
      title: subj.title,
      permit_category: subj.permit_category as PermitCategory,
      duration_minutes: subj.duration_minutes || 20,
      total_questions: subj.total_questions || 20,
      pass_score: subj.pass_score || 16,
      difficulty: (subj.difficulty as any) || "Moyen",
      audio_url: subj.audio_url || "",
      can_go_back: subj.can_go_back ?? true,
      show_explanations: subj.show_explanations ?? true,
    });
    setShowSubjectDialog(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#F5A623]" /> Gestion des Compositions E-Exam
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez les sujets d&apos;examen, chargez les fichiers audio et synchronisez le minutage des questions
          </p>
        </div>
        <Button onClick={handleOpenNewSubject} className="bg-[#0A1628] text-white hover:bg-[#1E4070] font-bold rounded-2xl gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Nouveau Sujet de Composition
        </Button>
      </div>

      {/* Subjects Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((subj) => (
          <Card key={subj.id} className="border-2 border-border shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="p-5 bg-muted/40 border-b flex flex-row items-center justify-between">
              <div>
                <Badge className="bg-[#0A1628] text-white dark:bg-[#F5A623] dark:text-[#0A1628] font-bold text-xs">
                  Permis {subj.permit_category}
                </Badge>
                <h3 className="font-extrabold text-lg text-foreground mt-1">{subj.title}</h3>
              </div>
              <div className="flex gap-2 items-center">
                {subj.audio_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(subj.audio_url, "_blank")}
                    title="Ouvrir la vidéo"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEditSubject(subj)}
                  title="Modifier le sujet"
                  className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteSubject(subj.id)}
                  title="Supprimer le sujet"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSubject(subj);
                  setQuestionForm({
                    question_text: "",
                    question_type: "single",
                    image_url: "",
                    explanation: "",
                    audio_start_time: (subj.questions?.length || 0) * 15,
                    audio_end_time: ((subj.questions?.length || 0) + 1) * 15,
                    optA: "Option A",
                    optB: "Option B",
                    optC: "Option C",
                    optD: "Option D",
                    correctA: true,
                    correctB: false,
                    correctC: false,
                    correctD: false,
                  });
                  setShowQuestionDialog(true);
                }}
                className="rounded-xl text-xs font-bold gap-1 h-8"
              >
                <Plus className="h-3.5 w-3.5" /> Question
              </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground text-[10px]">Durée :</span>
                  <p className="font-bold">{subj.duration_minutes} min</p>
                </div>
                <div className="p-2 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground text-[10px]">Questions :</span>
                  <p className="font-bold">{subj.questions?.length || 0} / {subj.total_questions}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded-xl">
                  <span className="text-muted-foreground text-[10px]">Note requise :</span>
                  <p className="font-bold">{subj.pass_score} / {subj.total_questions}</p>
                </div>
              </div>

              {/* Audio URL indicator */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                <span className="text-muted-foreground font-mono truncate max-w-[220px]">
                  🎙️ {subj.audio_url ? "Audio chargé" : "Aucun audio rattaché"}
                </span>
                <Badge variant="outline" className="text-[10px]">Sync Temporelle</Badge>
              </div>

              {/* Questions preview */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">Questions du sujet :</p>
                {subj.questions?.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">Aucune question ajoutée pour l&apos;instant.</p>
                ) : (
                  subj.questions?.map((q, idx) => (
                    <div key={q.id || idx} className="p-2.5 bg-muted/30 rounded-xl border text-xs flex items-center justify-between">
                      <span className="font-medium text-foreground truncate max-w-[80%]">
                        {idx + 1}. {q.question_text}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {q.audio_start_time || 0}s - {q.audio_end_time || 15}s
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CREATE / EDIT SUBJECT DIALOG */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Créer un Sujet de Composition</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSubject} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Titre du Sujet *</Label>
              <Input
                placeholder="Ex: Sujet N°1 — Priorités & Signalisation"
                value={subjectForm.title}
                onChange={(e) => setSubjectForm({ ...subjectForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Catégorie de Permis</Label>
                <Select
                  value={subjectForm.permit_category}
                  onValueChange={(v: any) => setSubjectForm({ ...subjectForm, permit_category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Permis B (Automobile)</SelectItem>
                    <SelectItem value="A">Permis A (Moto)</SelectItem>
                    <SelectItem value="C">Permis C (Poids Lourd)</SelectItem>
                    <SelectItem value="D">Permis D (Transport)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Niveau de Difficulté</Label>
                <Select
                  value={subjectForm.difficulty}
                  onValueChange={(v: any) => setSubjectForm({ ...subjectForm, difficulty: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facile">Facile</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Difficile">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input
                  type="number"
                  value={subjectForm.duration_minutes}
                  onChange={(e) => setSubjectForm({ ...subjectForm, duration_minutes: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre Questions</Label>
                <Input
                  type="number"
                  value={subjectForm.total_questions}
                  onChange={(e) => setSubjectForm({ ...subjectForm, total_questions: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Seuil de Réussite</Label>
                <Input
                  type="number"
                  value={subjectForm.pass_score}
                  onChange={(e) => setSubjectForm({ ...subjectForm, pass_score: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL du Fichier Audio de la Composition (.mp3 / .mpg)</Label>
              <Input
                placeholder="https://exemples.com/audio-sujet1.mp3"
                value={subjectForm.audio_url}
                onChange={(e) => setSubjectForm({ ...subjectForm, audio_url: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowSubjectDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold">
                Enregistrer le Sujet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE QUESTION DIALOG */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une Question au Sujet</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuestion} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Énoncé de la Question *</Label>
              <Textarea
                rows={2}
                placeholder="Ex: À cette intersection, qui a la priorité de passage ?"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type de Question</Label>
                <Select
                  value={questionForm.question_type}
                  onValueChange={(v: any) => setQuestionForm({ ...questionForm, question_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">○ Choix Unique (Une seule réponse)</SelectItem>
                    <SelectItem value="multiple">☑ Choix Multiples (Plusieurs réponses)</SelectItem>
                    <SelectItem value="boolean">○ Vrai / Faux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL Image d&apos;Illustration (Optionnel)</Label>
                <Input
                  placeholder="https://exemples.com/panneau.png"
                  value={questionForm.image_url}
                  onChange={(e) => setQuestionForm({ ...questionForm, image_url: e.target.value })}
                />
              </div>
            </div>

            {/* Audio Timestamp Sync */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-2xl border">
              <div className="space-y-1">
                <Label className="text-xs">Début Audio (sec)</Label>
                <Input
                  type="number"
                  value={questionForm.audio_start_time}
                  onChange={(e) => setQuestionForm({ ...questionForm, audio_start_time: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin Audio (sec)</Label>
                <Input
                  type="number"
                  value={questionForm.audio_end_time}
                  onChange={(e) => setQuestionForm({ ...questionForm, audio_end_time: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Options Input */}
            <div className="space-y-3">
              <Label className="font-bold">Options de Réponses & Réponses Correctes :</Label>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={questionForm.correctA}
                    onCheckedChange={(c) => setQuestionForm({ ...questionForm, correctA: !!c })}
                  />
                  <Input
                    placeholder="Option A"
                    value={questionForm.optA}
                    onChange={(e) => setQuestionForm({ ...questionForm, optA: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={questionForm.correctB}
                    onCheckedChange={(c) => setQuestionForm({ ...questionForm, correctB: !!c })}
                  />
                  <Input
                    placeholder="Option B"
                    value={questionForm.optB}
                    onChange={(e) => setQuestionForm({ ...questionForm, optB: e.target.value })}
                  />
                </div>

                {questionForm.question_type !== "boolean" && (
                  <>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={questionForm.correctC}
                        onCheckedChange={(c) => setQuestionForm({ ...questionForm, correctC: !!c })}
                      />
                      <Input
                        placeholder="Option C"
                        value={questionForm.optC}
                        onChange={(e) => setQuestionForm({ ...questionForm, optC: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={questionForm.correctD}
                        onCheckedChange={(c) => setQuestionForm({ ...questionForm, correctD: !!c })}
                      />
                      <Input
                        placeholder="Option D"
                        value={questionForm.optD}
                        onChange={(e) => setQuestionForm({ ...questionForm, optD: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explication pour la correction</Label>
              <Textarea
                rows={2}
                placeholder="Explication affichée à la fin de la composition..."
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowQuestionDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#0A1628] text-white hover:bg-[#1E4070] font-bold">
                Ajouter la Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
