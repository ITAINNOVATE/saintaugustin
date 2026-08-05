"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  BookOpen,
  FileText,
  Music,
  Video,
  Clock,
  Sparkles,
  Download,
} from "lucide-react";
import Link from "next/link";

interface LessonContentProps {
  lesson: any;
  initialProgress: any;
  studentId: string;
  courseId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export function LessonContent({
  lesson,
  initialProgress,
  studentId,
  courseId,
  prevLessonId,
  nextLessonId,
}: LessonContentProps) {
  const [completed, setCompleted] = useState(initialProgress?.is_completed || false);
  const [progressPercent, setProgressPercent] = useState(initialProgress?.progress_percent || 0);
  const [saving, setSaving] = useState(false);

  // Audio / Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  // Mark lesson as started if new
  useEffect(() => {
    if (!initialProgress) {
      handleUpdateProgress(20, false);
    }
  }, [lesson.id]);

  const handleUpdateProgress = async (percent: number, isFinished: boolean) => {
    setSaving(true);
    try {
      const { error } = await (supabase.from("lesson_progress") as any).upsert(
        {
          student_id: studentId,
          lesson_id: lesson.id,
          is_completed: isFinished,
          progress_percent: percent,
          last_position: Math.round(currentTime),
          updated_at: new Date().toISOString(),
          ...(isFinished ? { completed_at: new Date().toISOString() } : {}),
        },
        { onConflict: "student_id,lesson_id" }
      );

      if (!error) {
        setCompleted(isFinished);
        setProgressPercent(percent);
        if (isFinished) {
          toast({
            title: "Leçon terminée !",
            description: "Votre progression a été enregistrée avec succès.",
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Audio Handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      handleUpdateProgress(Math.max(progressPercent, 40), false);
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(curr);
    setDuration(dur);
    const pct = Math.min(100, Math.round((curr / dur) * 100));
    if (pct > progressPercent && !completed) {
      setProgressPercent(pct);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        Math.max(0, audioRef.current.currentTime + seconds),
        duration
      );
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isAudio = lesson.lesson_type === "audio";
  const isVideo = lesson.lesson_type === "video";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/apprenant/cours">
          <Button variant="ghost" size="icon-sm" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#F5A623] text-[#0A1628] font-bold text-[10px] uppercase">
              {lesson.lesson_type === "audio"
                ? "🎙️ Cours Audio"
                : lesson.lesson_type === "video"
                ? "📹 Cours Vidéo"
                : "📚 Cours Texte"}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {lesson.chapters?.title}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">{lesson.title}</h1>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-xl rounded-3xl bg-white dark:bg-[#0A1628]">
        {/* VIDEO PLAYER STUDIO */}
        {isVideo && (
          <div className="aspect-video bg-black relative flex items-center justify-center group overflow-hidden">
            <video
              ref={videoRef}
              src={lesson.file_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"}
              controls
              className="w-full h-full object-contain"
              onEnded={() => handleUpdateProgress(100, true)}
              onPlay={() => handleUpdateProgress(Math.max(progressPercent, 50), false)}
            />
          </div>
        )}

        {/* AUDIO PLAYER STUDIO */}
        {isAudio && (
          <div className="p-6 md:p-8 bg-gradient-to-br from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white border-b relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl" />

            <audio
              ref={audioRef}
              src={lesson.file_url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={() => {
                setIsPlaying(false);
                handleUpdateProgress(100, true);
              }}
            />

            <div className="relative z-10 space-y-6">
              {/* Track Info & Animated Waveform */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#F5A623] text-[#0A1628] flex items-center justify-center shadow-gold flex-shrink-0">
                  <Music className={`h-10 w-10 ${isPlaying ? "animate-bounce" : ""}`} />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <Badge className="bg-white/10 text-white border border-white/20 text-xs font-semibold">
                    Lecture Audio Haute Définition
                  </Badge>
                  <h3 className="text-xl font-extrabold text-white">{lesson.title}</h3>
                  <p className="text-xs text-white/70">
                    Auto École Saint Augustin • Formation théorique du permis
                  </p>
                </div>
              </div>

              {/* Animated Waveform Visualizer Bar */}
              <div className="flex items-center justify-center gap-1 h-8 px-4 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                {[40, 70, 30, 90, 60, 100, 50, 80, 30, 65, 85, 45, 95, 75, 35, 60, 90, 50, 70, 40, 85, 65, 30, 95].map((h, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? "bg-[#F5A623] animate-pulse" : "bg-white/30"
                    }`}
                    style={{ height: isPlaying ? `${Math.max(20, (h * (idx % 2 + 1)) % 100)}%` : "30%" }}
                  />
                ))}
              </div>

              {/* Audio Controls Bar */}
              <div className="space-y-3 pt-2">
                {/* Timeline Progress Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleAudioSeek}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
                  />
                  <div className="flex justify-between text-xs font-mono text-white/70">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main Player Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSkipTime(-10)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                      title="-10 secondes"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={togglePlayAudio}
                      size="lg"
                      className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] rounded-2xl h-12 w-12 flex items-center justify-center shadow-gold font-bold"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSkipTime(10)}
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                      title="+10 secondes"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Playback Speed Selector */}
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
                    {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                          playbackRate === r
                            ? "bg-[#F5A623] text-[#0A1628]"
                            : "text-white/70 hover:text-white"
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LESSON DESCRIPTION & TEXT CONTENT */}
        <CardContent className="p-6 md:p-8 space-y-6">
          {lesson.description && (
            <p className="text-muted-foreground text-base leading-relaxed italic border-l-4 border-[#F5A623] pl-4">
              {lesson.description}
            </p>
          )}

          <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap text-base font-normal">
            {lesson.content || "Contenu explicatif du cours en ligne."}
          </div>

          {/* Progress Bar & Completion Action */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Progression :</span>
              <span className="text-sm font-extrabold text-[#0A1628] dark:text-[#F5A623]">
                {progressPercent}%
              </span>
            </div>

            {!completed ? (
              <Button
                onClick={() => handleUpdateProgress(100, true)}
                disabled={saving}
                className="bg-[#00C9A7] text-white hover:bg-[#00B397] font-bold rounded-xl gap-2 shadow-accent px-6"
              >
                <CheckCircle2 className="h-4 w-4" /> Marquer comme terminé
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 dark:bg-green-950/40 px-4 py-2 rounded-xl border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-500" /> Leçon terminée & validée
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* NAVIGATION BUTTONS */}
      <div className="flex items-center justify-between">
        {prevLessonId ? (
          <Link href={`/apprenant/cours/${courseId}/lecon/${prevLessonId}`}>
            <Button variant="outline" className="rounded-xl font-semibold gap-2">
              <ArrowLeft className="h-4 w-4" /> Leçon précédente
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {nextLessonId ? (
          <Link href={`/apprenant/cours/${courseId}/lecon/${nextLessonId}`}>
            <Button className="bg-[#0A1628] text-white hover:bg-[#1E4070] rounded-xl font-bold gap-2">
              Leçon suivante <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/apprenant/cours">
            <Button className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold rounded-xl gap-2 shadow-gold">
              Retour au catalogue <BookOpen className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

