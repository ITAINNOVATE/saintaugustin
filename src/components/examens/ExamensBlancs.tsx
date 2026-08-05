"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatTimer, formatDate, getScoreColor } from "@/lib/utils";
import {
  GraduationCap, Clock, ChevronRight, ChevronLeft, CheckCircle,
  XCircle, AlertCircle, Play, RotateCcw, Trophy, TrendingUp, History
} from "lucide-react";
import type { Question, ExamSession } from "@/types/database";

interface ExamensBlancsProps {
  studentId: string;
  questions: Question[];
  history: ExamSession[];
  examConfig: { questionsCount: number; duration: number; passScore: number };
  hasActiveSubscription: boolean;
}

type ExamState = "idle" | "running" | "finished";

export function ExamensBlancs({ studentId, questions, history: initialHistory, examConfig, hasActiveSubscription }: ExamensBlancsProps) {
  const [state, setState] = useState<ExamState>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> answerId
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(examConfig.duration);
  const [history, setHistory] = useState(initialHistory);
  const [activeTab, setActiveTab] = useState<"exam" | "history">("exam");
  const [showResults, setShowResults] = useState<ExamSession | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Shuffle & pick questions
  const shuffleAndPick = useCallback(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(examConfig.questionsCount, shuffled.length));
  }, [questions, examConfig.questionsCount]);

  // Timer
  useEffect(() => {
    if (state !== "running") return;
    if (timeLeft <= 0) { handleFinish(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [state, timeLeft]);

  const handleStart = () => {
    if (!hasActiveSubscription) { toast({ title: "Abonnement requis", description: "Vous devez avoir un abonnement actif pour passer un examen.", variant: "destructive" }); return; }
    if (questions.length < 5) { toast({ title: "Pas assez de questions", description: "L'administrateur doit ajouter des questions à la banque d'examens.", variant: "destructive" }); return; }
    const picked = shuffleAndPick();
    setShuffledQuestions(picked);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(examConfig.duration);
    setState("running");
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleFinish = async () => {
    setState("finished");
    const totalQ = shuffledQuestions.length;
    let correct = 0;
    const detail = shuffledQuestions.map(q => {
      const chosenId = answers[q.id];
      const correctAns = q.answers?.find(a => a.is_correct);
      const chosen = q.answers?.find(a => a.id === chosenId);
      const isCorrect = chosenId === correctAns?.id;
      if (isCorrect) correct++;
      return {
        question_id: q.id, question_text: q.question_text,
        chosen_answer_id: chosenId, chosen_answer_text: chosen?.answer_text,
        correct_answer_id: correctAns?.id, correct_answer_text: correctAns?.answer_text,
        is_correct: isCorrect, explanation: q.explanation
      };
    });
    const score = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const isPassed = score >= examConfig.passScore;
    const timeTaken = examConfig.duration - timeLeft;

    // Build recommendations
    const wrongCategories = detail.filter(d => !d.is_correct).map((d) => {
      const q = shuffledQuestions.find(q => q.id === d.question_id);
      return q?.category || "Général";
    });
    const uniqueCats = [...new Set(wrongCategories)].slice(0, 3);
    const recommendations = isPassed
      ? ["Excellent ! Continuez à réviser pour maintenir ce niveau."]
      : [`Révisez les thèmes : ${uniqueCats.join(", ")}`, "Pratiquez davantage d'exercices par chapitre.", "Recommencez l'examen après révision."];

    const { data: session } = await (supabase.from("exam_sessions") as any).insert([{
      student_id: studentId, total_questions: totalQ, time_limit: examConfig.duration,
      score, correct_answers: correct, is_passed: isPassed, pass_score: examConfig.passScore,
      questions_detail: detail, recommendations, completed_at: new Date().toISOString()
    }]).select().single();

    if (session) setHistory(prev => [session as any, ...prev]);
    toast({ title: isPassed ? "🎉 Examen réussi !" : "Examen terminé", description: `Score : ${score}% — ${correct}/${totalQ} bonnes réponses` });
  };

  const q = shuffledQuestions[currentQ];
  const answered = Object.keys(answers).length;
  const progress = shuffledQuestions.length > 0 ? Math.round((currentQ / shuffledQuestions.length) * 100) : 0;
  const timerColor = timeLeft <= 300 ? "text-red-500" : timeLeft <= 600 ? "text-orange-500" : "text-foreground";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F5A623] flex items-center justify-center"><GraduationCap className="h-5 w-5 text-[#0A1628]" /></div>
        <div><h1 className="text-2xl font-bold">Examens Blancs</h1><p className="text-muted-foreground text-sm">Simulation de l'examen du Code de la Route</p></div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("exam")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "exam" ? "bg-[#0A1628] text-white" : "bg-muted text-muted-foreground"}`}>Examen</button>
        <button onClick={() => setActiveTab("history")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "history" ? "bg-[#0A1628] text-white" : "bg-muted text-muted-foreground"}`}>Historique ({history.length})</button>
      </div>

      {activeTab === "exam" && (
        <>
          {state === "idle" && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-[#F5A623]/10 border-2 border-[#F5A623]/30 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-10 w-10 text-[#F5A623]" />
                </div>
                <h2 className="text-xl font-bold mb-3">Prêt pour l'examen blanc ?</h2>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                  <div className="text-center"><p className="text-2xl font-bold text-[#0A1628] dark:text-[#F5A623]">{Math.min(examConfig.questionsCount, questions.length)}</p><p className="text-xs text-muted-foreground">Questions</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-[#0A1628] dark:text-[#F5A623]">{Math.floor(examConfig.duration / 60)}min</p><p className="text-xs text-muted-foreground">Durée</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-[#0A1628] dark:text-[#F5A623]">{examConfig.passScore}%</p><p className="text-xs text-muted-foreground">Score requis</p></div>
                </div>
                {!hasActiveSubscription && (
                  <div className="mb-4 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 max-w-sm mx-auto">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Abonnement actif requis pour passer l'examen.
                  </div>
                )}
                <Button onClick={handleStart} size="lg" disabled={!hasActiveSubscription || questions.length < 5} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold gap-2 shadow-gold">
                  <Play className="h-5 w-5" /> Commencer l'examen
                </Button>
              </CardContent>
            </Card>
          )}

          {state === "running" && q && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Question {currentQ + 1}/{shuffledQuestions.length}</span>
                  <span className="text-xs text-muted-foreground">{answered} répondue(s)</span>
                </div>
                <div className={`exam-timer ${timerColor} flex items-center gap-2`}>
                  <Clock className="h-5 w-5" />
                  {formatTimer(timeLeft)}
                </div>
              </div>
              <Progress value={progress} className="h-2" />

              {/* Question */}
              <Card className="question-card">
                <CardContent className="p-6">
                  {q.image_url && <img src={q.image_url} alt="" className="rounded-xl mb-4 max-h-48 object-contain mx-auto" />}
                  <h3 className="text-base font-semibold mb-6 leading-relaxed">{q.question_text}</h3>
                  <div className="space-y-3">
                    {(q.answers || []).map(answer => {
                      const isSelected = answers[q.id] === answer.id;
                      return (
                        <button key={answer.id} onClick={() => handleAnswer(q.id, answer.id)}
                          className={`answer-option w-full text-left ${isSelected ? "selected border-[#0A1628] bg-[#0A1628]/5 dark:bg-[#0A1628]/20" : "border-border"}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? "border-[#0A1628] bg-[#0A1628]" : "border-muted-foreground"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm">{answer.answer_text}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
                <div className="flex gap-2">
                  {currentQ < shuffledQuestions.length - 1 ? (
                    <Button onClick={() => setCurrentQ(q => q + 1)} className="bg-[#0A1628] hover:bg-[#1E4070] gap-2">
                      Suivant <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleFinish} className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold gap-2">
                      Terminer <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {state === "finished" && history[0] && (
            <div className="space-y-4">
              <Card className={`border-2 ${history[0].is_passed ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : 'border-red-300 bg-red-50 dark:bg-red-950/20'}`}>
                <CardContent className="py-10 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${history[0].is_passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    {history[0].is_passed ? <Trophy className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-500" />}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{history[0].is_passed ? 'Félicitations !' : 'Examen non réussi'}</h2>
                  <p className={`text-4xl font-bold mb-4 ${getScoreColor(history[0].score || 0, history[0].pass_score)}`}>{history[0].score}%</p>
                  <p className="text-muted-foreground">{history[0].correct_answers}/{history[0].total_questions} bonnes réponses</p>
                  {(history[0].recommendations as string[])?.map((r, i) => (
                    <p key={i} className="text-sm text-muted-foreground mt-2 italic">{r}</p>
                  ))}
                  <div className="flex justify-center gap-3 mt-6">
                    <Button variant="outline" onClick={() => setState("idle")} className="gap-2"><RotateCcw className="h-4 w-4" /> Nouvel examen</Button>
                    <Button onClick={() => setActiveTab("history")} className="gap-2"><History className="h-4 w-4" /> Voir historique</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><History className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Aucun examen composé</p></CardContent></Card>
          ) : history.map(session => (
            <Card key={session.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${session.is_passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {session.is_passed ? <CheckCircle className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(session.started_at)} · {session.correct_answers}/{session.total_questions} bonnes réponses</p>
                </div>
                <span className={`text-2xl font-bold ${getScoreColor(session.score || 0, session.pass_score)}`}>{session.score}%</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
