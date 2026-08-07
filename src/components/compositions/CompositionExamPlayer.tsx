"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Maximize2,
  Minimize2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { CompositionSubject, CompositionQuestion, CompositionQuestionOption } from "@/types/database";

interface CompositionExamPlayerProps {
  subject: CompositionSubject;
  questions: CompositionQuestion[];
  studentId: string;
}

export function CompositionExamPlayer({ subject, questions, studentId }: CompositionExamPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Record<questionId, string[]>
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(subject.duration_minutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Audio & Volume state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const audioRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Evaluation results
  const [results, setResults] = useState<{
    score: number;
    total: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    isPassed: boolean;
    durationSeconds: number;
  } | null>(null);

  // Initialize volume at max level on load
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, volumeLevel);
    }
  }, [volumeLevel, subject.audio_url]);

  const handleVolumeChange = (vol: number) => {
    setVolumeLevel(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = volumeLevel;
    if (isPlayingAudio) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 0;
    setAudioCurrentTime(currentTime);
    setAudioDuration(duration);

    // Automatic Question Advancement Engine
    if (duration > 0 && questions.length > 0 && !isSubmitted) {
      const durationPerQuestion = duration / questions.length;
      const calculatedIndex = Math.min(
        questions.length - 1,
        Math.floor(currentTime / durationPerQuestion)
      );
      if (calculatedIndex !== currentQuestionIndex && calculatedIndex >= 0) {
        setCurrentQuestionIndex(calculatedIndex);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    toast({
      title: "Épreuve Terminée",
      description: "La vidéo du sujet officiel est terminée. Correction automatique effectuée.",
    });
    handleSubmitExam();
  };

  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentQuestionIndex(idx);
    const targetQ = questions[idx];
    if (targetQ && targetQ.audio_start_time !== undefined && audioRef.current) {
      audioRef.current.currentTime = targetQ.audio_start_time;
    }
  };
  const handleSingleSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }));
  };

  const handleMultipleSelect = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    const current = answers[questionId] || [];
    const updated = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];

    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated,
    }));
  };

  // 3. Automatic Correction Engine
  const handleSubmitExam = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    if (audioRef.current) audioRef.current.pause();

    let correctCount = 0;
    let wrongCount = 0;

    questions.forEach((q) => {
      const studentAnswers = (answers[q.id] || []).sort();
      const expectedAnswers = (q.correct_answers || []).sort();

      const isExactMatch =
        studentAnswers.length === expectedAnswers.length &&
        studentAnswers.every((val, index) => val === expectedAnswers[index]);

      if (isExactMatch) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPassed = correctCount >= subject.pass_score;
    const durationSeconds = subject.duration_minutes * 60 - timeLeft;

    const res = {
      score: correctCount,
      total,
      percentage,
      correctCount,
      wrongCount,
      isPassed,
      durationSeconds,
    };
    setResults(res);

    // Save session to database / state
    try {
      await (supabase.from("composition_sessions") as any).insert([
        {
          student_id: studentId,
          subject_id: subject.id,
          score: correctCount,
          total_questions: total,
          correct_answers: correctCount,
          wrong_answers: wrongCount,
          percentage,
          is_passed: isPassed,
          duration_seconds: durationSeconds,
          answers_detail: answers,
          completed_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {}

    toast({
      title: isPassed ? "🎉 Composition Réussie !" : "⚠️ Composition Non Validée",
      description: `Note finale : ${correctCount} / ${total} (${percentage}%)`,
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? "p-6 bg-background min-h-screen" : "max-w-5xl mx-auto"} animate-fade-in pb-12`}>
      {/* Media Player element (Supports .mpg, .mp4 and .mp3) */}
      <div className="w-full aspect-video max-h-[380px] bg-black rounded-3xl overflow-hidden border-2 border-[#F5A623] shadow-2xl relative">
        <video
          key={subject.audio_url}
          ref={audioRef as any}
          src={subject.audio_url}
          controls
          playsInline
          className="w-full h-full object-contain"
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onPlay={() => setIsPlayingAudio(true)}
          onPause={() => setIsPlayingAudio(false)}
        />
      </div>

      {/* TOP HEADER CONTROLS BAR */}
      <div className="p-4 bg-[#0A1628] text-white rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border-2 border-[#F5A623]">
        <div className="flex items-center gap-3">
          <Link href="/apprenant/compositions">
            <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <Badge className="bg-[#F5A623] text-[#0A1628] font-bold text-[10px] uppercase">
              Permis {subject.permit_category}
            </Badge>
            <h1 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">
              {subject.title}
            </h1>
          </div>
        </div>

        {/* Audio Sync & Timer Controls */}
        <div className="flex items-center gap-3">
          {/* Volume Booster Control */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
            <Volume2 className="h-4 w-4 text-[#F5A623] ml-1 mr-0.5" />
            {[0.5, 1, 1.5, 2].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleVolumeChange(v)}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                  volumeLevel === v
                    ? "bg-[#F5A623] text-[#0A1628]"
                    : "text-white/70 hover:text-white"
                }`}
                title={`Volume ${v * 100}%`}
              >
                {v * 100}%
              </button>
            ))}
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-red-500/20 text-red-300 px-3 py-1.5 rounded-xl border border-red-500/30 font-mono text-sm font-bold">
            <Clock className="h-4 w-4 text-red-400 animate-pulse" />
            {formatTimer(timeLeft)}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreenMode}
            className="text-white/70 hover:text-white rounded-xl"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* RESULTS DISPLAY SCREEN (IF SUBMITTED) */}
      {isSubmitted && results ? (
        <Card className="overflow-hidden border-2 border-border shadow-2xl rounded-3xl bg-white dark:bg-[#0A1628]">
          <CardHeader className={`p-8 text-white text-center ${results.isPassed ? "bg-gradient-to-r from-green-700 to-emerald-600" : "bg-gradient-to-r from-red-700 to-rose-600"}`}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
              {results.isPassed ? <Award className="h-10 w-10 text-white" /> : <XCircle className="h-10 w-10 text-white" />}
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-extrabold px-4 py-1 rounded-full uppercase">
              {results.isPassed ? "Épreuve Validée • Bravo !" : "Épreuve Non Validée"}
            </Badge>
            <h2 className="text-3xl font-extrabold mt-2">
              Note finale : {results.score} / {results.total}
            </h2>
            <p className="text-white/80 text-sm font-semibold mt-1">
              Pourcentage de réussite : {results.percentage}% (Seuil requis : {subject.pass_score} / {subject.total_questions})
            </p>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 rounded-2xl text-center">
                <p className="text-xs text-green-700 dark:text-green-400 font-bold">Bonnes Réponses</p>
                <p className="text-2xl font-extrabold text-green-700 dark:text-green-400">{results.correctCount}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-2xl text-center">
                <p className="text-xs text-red-700 dark:text-red-400 font-bold">Erreurs</p>
                <p className="text-2xl font-extrabold text-red-700 dark:text-red-400">{results.wrongCount}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-2xl text-center">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">Temps Écoulé</p>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{Math.round(results.durationSeconds / 60)} min</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 rounded-2xl text-center">
                <p className="text-xs text-purple-700 dark:text-purple-400 font-bold">Pourcentage</p>
                <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">{results.percentage}%</p>
              </div>
            </div>

            {/* Detailed Correction Breakdown if allowed */}
            {subject.show_explanations && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#F5A623]" /> Correction & Explicatifs des Questions
                </h3>
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const studentAns = (answers[q.id] || []).sort();
                    const expectedAns = (q.correct_answers || []).sort();
                    const isCorrect =
                      studentAns.length === expectedAns.length &&
                      studentAns.every((v, i) => v === expectedAns[i]);

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border-2 space-y-3 ${
                          isCorrect ? "bg-green-50/50 dark:bg-green-950/20 border-green-200" : "bg-red-50/50 dark:bg-red-950/20 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm">
                            Question N°{idx + 1} : {q.question_text}
                          </span>
                          {isCorrect ? (
                            <Badge className="bg-green-600 text-white font-bold">✓ Correct</Badge>
                          ) : (
                            <Badge className="bg-red-600 text-white font-bold">✕ Erreur</Badge>
                          )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt) => {
                            const isStudentSelected = studentAns.includes(opt.id);
                            const isExpected = expectedAns.includes(opt.id);
                            return (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between ${
                                  isExpected
                                    ? "bg-green-100 text-green-800 border-green-400 dark:bg-green-900/60 dark:text-green-200"
                                    : isStudentSelected
                                    ? "bg-red-100 text-red-800 border-red-400 dark:bg-red-900/60 dark:text-red-200"
                                    : "bg-background border-border text-muted-foreground"
                                }`}
                              >
                                <span>{opt.label}. {opt.text}</span>
                                {isExpected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <p className="text-xs italic text-muted-foreground bg-white/60 dark:bg-black/40 p-3 rounded-xl border border-border">
                            💡 Explication : {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/apprenant/compositions">
                <Button className="bg-[#0A1628] text-white hover:bg-[#1E4070] font-extrabold rounded-2xl px-8 py-5">
                  Retour à la liste des Compositions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ACTIVE EXAM WORKSPACE */
        <div className="space-y-6">
          {/* Question Progress Stepper Bar */}
          <div className="p-4 bg-white dark:bg-[#0A1628] border-2 border-border rounded-2xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} sur {questions.length}
              </span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% accompli</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2 rounded-full" />
          </div>

          {/* QUESTION CARD WITH AUDIO RESPONSE KEYPAD */}
          <Card className="border-2 border-border shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-[#0A1628]">
            <CardHeader className="p-6 bg-muted/30 border-b flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0A1628] text-white dark:bg-[#F5A623] dark:text-[#0A1628] font-extrabold text-xs">
                    Question N° {currentQuestionIndex + 1} / {questions.length}
                  </Badge>
                  <Badge className="bg-[#00C9A7] text-white font-extrabold text-[11px] flex items-center gap-1 animate-pulse">
                    ⚡ Avancement Vidéo Automatique
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {currentQuestion?.question_type === "multiple"
                      ? "☑ Choix Multiples (Sélectionnez plusieurs)"
                      : currentQuestion?.question_type === "boolean"
                      ? "○ Vrai / Faux"
                      : "○ Choix Unique"}
                  </Badge>
                </div>
                <h2 className="text-xl font-extrabold text-foreground mt-2 flex items-center gap-2">
                  🎧 Écoutez l&apos;énoncé dans l&apos;audio et sélectionnez votre réponse :
                </h2>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Image illustration if scenario image is provided */}
              {currentQuestion?.image_url && (
                <div className="relative w-full h-64 sm:h-80 bg-black/5 rounded-2xl overflow-hidden border border-border flex items-center justify-center">
                  <Image
                    src={currentQuestion.image_url}
                    alt="Illustration de la question"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}

              {/* RESPONSE CHOICE KEYPAD (A, B, C, D) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                {currentQuestion?.options.map((opt) => {
                  const isSelected = (answers[currentQuestion.id] || []).includes(opt.id);

                  if (currentQuestion.question_type === "multiple") {
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleMultipleSelect(currentQuestion.id, opt.id)}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center ${
                          isSelected
                            ? "bg-[#F5A623] text-[#0A1628] border-[#F5A623] font-extrabold shadow-gold scale-105"
                            : "bg-background border-border hover:border-[#F5A623] text-foreground"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${
                          isSelected ? "bg-[#0A1628] text-white" : "bg-muted text-foreground"
                        }`}>
                          {opt.label}
                        </div>
                        <span className="text-sm font-bold">Réponse {opt.label}</span>
                      </button>
                    );
                  }

                  // Single Choice / Boolean
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSingleSelect(currentQuestion.id, opt.id)}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#0A1628] text-white border-[#0A1628] font-extrabold shadow-xl scale-105 dark:bg-[#F5A623] dark:text-[#0A1628] dark:border-[#F5A623]"
                          : "bg-background border-border hover:border-[#0A1628] text-foreground"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${
                        isSelected ? "bg-[#F5A623] text-[#0A1628] dark:bg-[#0A1628] dark:text-white" : "bg-muted text-foreground"
                      }`}>
                        {opt.label}
                      </div>
                      <span className="text-sm font-bold">Réponse {opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* QUESTIONS MATRIX GRID STEPPER (1 - 20) */}
              <div className="pt-4 border-t border-border space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Aperçu de vos réponses ({Object.keys(answers).length} / {questions.length} répondue(s)) :
                </p>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, idx) => {
                    const hasAnswer = (answers[q.id] || []).length > 0;
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => goToQuestion(idx)}
                        className={`w-9 h-9 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center border cursor-pointer ${
                          isCurrent
                            ? "ring-2 ring-offset-1 ring-[#F5A623] bg-[#0A1628] text-white"
                            : hasAnswer
                            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/60 dark:text-green-400"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NAVIGATION & SUBMISSION FOOTER */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => goToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0 || !subject.can_go_back}
                  className="rounded-2xl gap-2 font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Précédent
                </Button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    className="bg-[#0A1628] text-white hover:bg-[#1E4070] rounded-2xl font-bold gap-2 px-6"
                  >
                    Question suivante <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitExam}
                    className="bg-[#00C9A7] text-white hover:bg-[#00B397] font-extrabold rounded-2xl gap-2 px-8 shadow-accent"
                  >
                    <CheckCircle2 className="h-5 w-5" /> Soumettre la composition
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
