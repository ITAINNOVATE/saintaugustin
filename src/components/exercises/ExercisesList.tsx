"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { BookOpen, Award, CheckCircle, XCircle, AlertCircle, Play, History, ChevronRight } from "lucide-react";

interface ExercisesListProps {
  studentId: string;
  chapters: any[];
  history: any[];
  hasActiveSubscription: boolean;
}

export function ExercisesList({ studentId, chapters, history: initialHistory, hasActiveSubscription }: ExercisesListProps) {
  const [history, setHistory] = useState(initialHistory);
  const [activeTab, setActiveTab] = useState<"practice" | "history">("practice");
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleStartPractice = async (chapter: any) => {
    if (!hasActiveSubscription) {
      toast({
        title: "Abonnement requis",
        description: "Vous devez avoir un abonnement actif pour faire ces exercices.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: questions } = await supabase
        .from("questions")
        .select("*, answers(*)")
        .eq("chapter_id", chapter.id)
        .limit(10);

      if (!questions || questions.length === 0) {
        toast({
          title: "Pas d'exercices",
          description: "Aucune question disponible pour ce chapitre.",
          variant: "destructive"
        });
        return;
      }

      setSessionQuestions(questions);
      setAnswers({});
      setCurrentQ(0);
      setIsFinished(false);
      setActiveChapter(chapter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    if (isFinished) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleFinish = async () => {
    setIsFinished(true);
    let correct = 0;
    sessionQuestions.forEach(q => {
      const chosenId = answers[q.id];
      const correctAns = q.answers?.find((a: any) => a.is_correct);
      if (chosenId === correctAns?.id) correct++;
    });

    const score = Math.round((correct / sessionQuestions.length) * 100);

    try {
      const { data } = await (supabase
        .from("exercise_sessions") as any)
        .insert([{
          student_id: studentId,
          chapter_id: activeChapter.id,
          total_questions: sessionQuestions.length,
          correct_answers: correct,
          score,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (data) {
        setHistory(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00C9A7] flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Exercices Pratiques</h1>
          <p className="text-muted-foreground text-sm">Entraînez-vous par chapitre</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "practice" ? "bg-[#0A1628] text-white" : "bg-muted text-muted-foreground"}`}
        >
          Séries d&apos;entraînement
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "history" ? "bg-[#0A1628] text-white" : "bg-muted text-muted-foreground"}`}
        >
          Mon historique ({history.length})
        </button>
      </div>

      {activeTab === "practice" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map(chapter => (
            <Card key={chapter.id} className="hover:shadow-card-hover transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <span className="text-xs font-semibold text-[#F5A623] uppercase tracking-wider">{chapter.courses?.title}</span>
                <CardTitle className="text-base mt-0.5">{chapter.title}</CardTitle>
                {chapter.description && (
                  <CardDescription className="line-clamp-2 text-xs">{chapter.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between mt-auto">
                <span className="text-xs text-muted-foreground">
                  {chapter.questions?.length || 0} question(s) dispo.
                </span>
                <Button
                  onClick={() => handleStartPractice(chapter)}
                  disabled={loading}
                  size="sm"
                  className="bg-[#0A1628] hover:bg-[#1E4070]"
                >
                  S&apos;entraîner <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Aucun exercice d&apos;entraînement effectué.</p>
              </CardContent>
            </Card>
          ) : (
            history.map(session => {
              const ch = chapters.find(c => c.id === session.chapter_id);
              const isPassed = session.score >= 70;
              return (
                <Card key={session.id} className="hover:shadow-card-hover transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isPassed ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{ch?.title || "Chapitre inconnu"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.completed_at || session.started_at)} · {session.correct_answers}/{session.total_questions} correctes
                        </p>
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                      {session.score}%
                    </span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Practice Session Dialog */}
      <Dialog open={!!activeChapter} onOpenChange={() => setActiveChapter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeChapter && sessionQuestions.length > 0 && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{activeChapter.title} — Entraînement</DialogTitle>
              </DialogHeader>

              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Question {currentQ + 1} sur {sessionQuestions.length}</span>
                <span>{Object.keys(answers).length} répondues</span>
              </div>

              {/* Question */}
              <div className="p-4 bg-muted/40 rounded-xl space-y-4">
                {sessionQuestions[currentQ].image_url && (
                  <img src={sessionQuestions[currentQ].image_url} alt="" className="max-h-48 object-contain mx-auto rounded-lg" />
                )}
                <p className="font-medium text-sm md:text-base leading-relaxed">
                  {sessionQuestions[currentQ].question_text}
                </p>

                <div className="space-y-2 mt-4">
                  {sessionQuestions[currentQ].answers?.map((ans: any) => {
                    const isSelected = answers[sessionQuestions[currentQ].id] === ans.id;
                    const correctAns = sessionQuestions[currentQ].answers?.find((a: any) => a.is_correct);
                    const showCorrect = isFinished && ans.is_correct;
                    const showWrong = isFinished && isSelected && !ans.is_correct;

                    return (
                      <button
                        key={ans.id}
                        onClick={() => handleAnswer(sessionQuestions[currentQ].id, ans.id)}
                        disabled={isFinished}
                        className={`w-full text-left p-3 rounded-lg border-2 flex items-center gap-3 transition-colors ${
                          showCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                            : showWrong
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                            : isSelected
                            ? 'border-[#0A1628] bg-[#0A1628]/5 dark:bg-[#0A1628]/20'
                            : 'border-border hover:border-[#0A1628]/30'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          showCorrect ? 'border-green-500 bg-green-500' : showWrong ? 'border-red-500 bg-red-500' : isSelected ? 'border-[#0A1628]' : 'border-muted-foreground'
                        }`}>
                          {isSelected && !isFinished && <div className="w-1.5 h-1.5 rounded-full bg-[#0A1628]" />}
                        </div>
                        <span className="text-sm">{ans.answer_text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {isFinished && sessionQuestions[currentQ].explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs md:text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-bold flex items-center gap-1 mb-1"><AlertCircle className="h-4 w-4" /> Explication :</span>
                  {sessionQuestions[currentQ].explanation}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                >
                  Précédent
                </Button>
                <div className="flex gap-2">
                  {!isFinished && Object.keys(answers).length === sessionQuestions.length && (
                    <Button onClick={handleFinish} className="bg-[#00C9A7] text-white hover:bg-[#00B397]">
                      Terminer & Corriger
                    </Button>
                  )}
                  {currentQ < sessionQuestions.length - 1 ? (
                    <Button size="sm" onClick={() => setCurrentQ(q => q + 1)} className="bg-[#0A1628] hover:bg-[#1E4070]">
                      Suivant
                    </Button>
                  ) : (
                    isFinished && (
                      <Button size="sm" onClick={() => setActiveChapter(null)} className="bg-[#F5A623] text-[#0A1628]">
                        Fermer
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
