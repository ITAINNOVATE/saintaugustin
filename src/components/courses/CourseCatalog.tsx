"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Play, FileText, Music, Image, ChevronDown, ChevronRight, CheckCircle2, Clock, Search, Lock } from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";
import Link from "next/link";

const lessonTypeIcon = (type: string) => {
  const icons: Record<string, any> = { video: Play, audio: Music, pdf: FileText, image: Image, text: BookOpen, animation: Play };
  return icons[type] || BookOpen;
};

interface CourseCatalogProps {
  courses: any[];
  progressMap: Record<string, { is_completed: boolean; progress_percent: number; last_position: number }>;
  studentId: string;
}

export function CourseCatalog({ courses, progressMap, studentId }: CourseCatalogProps) {
  const [search, setSearch] = useState("");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(courses[0]?.id || null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.chapters?.some((ch: any) => ch.title.toLowerCase().includes(search.toLowerCase()))
  );

  const getCourseProgress = (course: any) => {
    const lessons = course.chapters?.flatMap((ch: any) => ch.lessons || []) || [];
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l: any) => progressMap[l.id]?.is_completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  const getChapterProgress = (chapter: any) => {
    const lessons = chapter.lessons || [];
    if (lessons.length === 0) return 0;
    const completed = lessons.filter((l: any) => progressMap[l.id]?.is_completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes Cours</h1>
          <p className="text-muted-foreground text-sm">{courses.length} cours disponible(s)</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Featured Lesson Banner: Lecture des Panneaux */}
      <Card className="overflow-hidden border-2 border-[#F5A623] bg-gradient-to-r from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white shadow-xl rounded-3xl relative">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left flex-1">
            <Badge className="bg-[#F5A623] text-[#0A1628] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              🔥 Cours N°1 • Recommandé
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Lecture des Panneaux de Signalisation
            </h2>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              Étudiez les <strong>73 panneaux officiels</strong> du Code de la Route (Danger, Obligation, Interdiction...) avec affichage grand format et explications détaillées.
            </p>
          </div>

          <Link href="/apprenant/cours/panneaux">
            <Button
              size="lg"
              className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold text-base px-8 py-6 rounded-2xl shadow-gold flex items-center gap-3 hover:scale-105 transition-all cursor-pointer"
            >
              <BookOpen className="h-5 w-5" />
              Démarrer le cours →
            </Button>
          </Link>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun cours disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((course) => {
            const courseProgress = getCourseProgress(course);
            const totalLessons = course.chapters?.flatMap((ch: any) => ch.lessons || []).length || 0;
            const isExpanded = expandedCourse === course.id;
            return (
              <Card key={course.id} className="overflow-hidden">
                <button className="w-full text-left" onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-[#F5A623]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{course.title}</h3>
                        {courseProgress === 100 && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{totalLessons} leçon(s) · {course.chapters?.length || 0} chapitre(s)</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={courseProgress} className="flex-1 h-1.5" />
                        <span className="text-xs font-semibold text-muted-foreground">{courseProgress}%</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3 pl-4 border-l-2 border-muted ml-6">
                      {(course.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index).map((chapter: any) => {
                        const chProgress = getChapterProgress(chapter);
                        const isChExpanded = expandedChapter === chapter.id;
                        return (
                          <div key={chapter.id}>
                            <button className="w-full text-left flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedChapter(isChExpanded ? null : chapter.id)}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${chProgress === 100 ? 'bg-green-100 text-green-700' : 'bg-[#0A1628]/10 text-[#0A1628]'}`}>
                                {chProgress === 100 ? '✓' : chapter.order_index + 1}
                              </div>
                              <span className="font-medium text-sm flex-1">{chapter.title}</span>
                              <span className="text-xs text-muted-foreground">{chProgress}%</span>
                              {isChExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>

                            {isChExpanded && (
                              <div className="ml-8 mt-1 space-y-1">
                                {(chapter.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index).map((lesson: any) => {
                                  const prog = progressMap[lesson.id];
                                  const isCompleted = prog?.is_completed;
                                  const LIcon = lessonTypeIcon(lesson.lesson_type);
                                  return (
                                    <Link key={lesson.id} href={`/apprenant/cours/${course.id}/lecon/${lesson.id}`}>
                                      <div className={`flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isCompleted ? 'opacity-75' : ''}`}>
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <LIcon className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{lesson.title}</p>
                                          {lesson.duration && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(lesson.duration)}</p>}
                                        </div>
                                        {prog && !isCompleted && prog.progress_percent > 0 && (
                                          <span className="text-xs text-[#F5A623] font-semibold">{prog.progress_percent}%</span>
                                        )}
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
