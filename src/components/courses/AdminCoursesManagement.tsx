"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, FileText, Play, Music, Image, GripVertical } from "lucide-react";

interface AdminCoursesManagementProps {
  courses: any[];
  adminId: string;
}

export function AdminCoursesManagement({ courses: initialCourses, adminId }: AdminCoursesManagementProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "", level: "débutant" });
  const [chapterForm, setChapterForm] = useState({ title: "", description: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", lesson_type: "text", content: "", file_url: "", duration: "" });

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (selectedCourse) {
        const { error } = await (supabase.from("courses") as any).update(courseForm).eq("id", selectedCourse.id);
        if (!error) { setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, ...courseForm } : c)); toast({ title: "Cours modifié" }); }
      } else {
        const { data, error } = await (supabase.from("courses") as any).insert([{ ...courseForm, created_by: adminId, order_index: courses.length }]).select().single();
        if (!error && data) { setCourses(prev => [...prev, { ...data, chapters: [] }]); toast({ title: "Cours créé" }); }
      }
      setShowCourseDialog(false);
    });
  };

  const handleTogglePublish = async (course: any) => {
    const { error } = await (supabase.from("courses") as any).update({ is_published: !course.is_published }).eq("id", course.id);
    if (!error) { setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !course.is_published } : c)); toast({ title: course.is_published ? "Cours dépublié" : "Cours publié" }); }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    startTransition(async () => {
      const chapterCount = selectedCourse.chapters?.length || 0;
      const { data, error } = await (supabase.from("chapters") as any).insert([{ ...chapterForm, course_id: selectedCourse.id, order_index: chapterCount }]).select().single();
      if (!error && data) {
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, chapters: [...(c.chapters || []), { ...data, lessons: [] }] } : c));
        toast({ title: "Chapitre ajouté" }); setShowChapterDialog(false);
      }
    });
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter || !selectedCourse) return;
    startTransition(async () => {
      const lessonCount = selectedChapter.lessons?.length || 0;
      const { data, error } = await (supabase.from("lessons") as any).insert([{
        ...lessonForm, chapter_id: selectedChapter.id, course_id: selectedCourse.id,
        created_by: adminId, order_index: lessonCount, duration: lessonForm.duration ? parseInt(lessonForm.duration) : null
      }]).select().single();
      if (!error && data) {
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? {
          ...c, chapters: (c.chapters || []).map((ch: any) => ch.id === selectedChapter.id ? { ...ch, lessons: [...(ch.lessons || []), data] } : ch)
        } : c));
        toast({ title: "Leçon ajoutée" }); setShowLessonDialog(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Gestion des Cours</h1><p className="text-muted-foreground text-sm">{courses.length} cours de code disponible(s)</p></div>
        <Button onClick={() => { setSelectedCourse(null); setCourseForm({ title: "", description: "", category: "", level: "débutant" }); setShowCourseDialog(true); }} className="bg-[#0A1628] hover:bg-[#1E4070] gap-2"><Plus className="h-4 w-4" />Nouveau cours</Button>
      </div>

      {/* Featured Lesson Banner: Lecture des Panneaux pour Administrateur */}
      <Card className="overflow-hidden border-2 border-[#F5A623] bg-gradient-to-r from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white shadow-xl rounded-3xl relative">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left flex-1">
            <Badge className="bg-[#F5A623] text-[#0A1628] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              🔥 Cours Officiel N°1 • Panneaux Interactifs
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Lecture des 73 Panneaux de Signalisation
            </h2>
            <p className="text-white/80 text-sm max-w-xl leading-relaxed">
              Consultez et testez le module interactif contenant les <strong>73 panneaux de signalisation du Code de la Route</strong> (Danger, Interdiction, Obligation, Indication...).
            </p>
          </div>

          <Link href="/apprenant/cours/panneaux">
            <Button
              size="lg"
              className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] font-bold text-base px-8 py-6 rounded-2xl shadow-gold flex items-center gap-3 hover:scale-105 transition-all cursor-pointer"
            >
              <BookOpen className="h-5 w-5" />
              Ouvrir le cours Panneaux →
            </Button>
          </Link>
        </div>
      </Card>

      <div className="space-y-3">
        {courses.map(course => (
          <Card key={course.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}>
                <div className="w-10 h-10 rounded-xl bg-[#0A1628]/10 dark:bg-[#0A1628] flex items-center justify-center"><BookOpen className="h-5 w-5 text-[#0A1628] dark:text-[#F5A623]" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold">{course.title}</h3>
                    <span className={`badge text-xs ${course.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-border'}`}>{course.is_published ? 'Publié' : 'Brouillon'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{course.chapters?.length || 0} chapitre(s) · {course.chapters?.flatMap((ch: any) => ch.lessons || []).length || 0} leçon(s)</p>
                </div>
                {expandedCourse === course.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => handleTogglePublish(course)} title={course.is_published ? "Dépublier" : "Publier"}>
                  {course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => { setSelectedCourse(course); setCourseForm({ title: course.title, description: course.description || "", category: course.category || "", level: course.level || "débutant" }); setShowCourseDialog(true); }}><Edit className="h-4 w-4" /></Button>
              </div>
            </div>

            {expandedCourse === course.id && (
              <div className="px-4 pb-4 border-t">
                <div className="mt-3 space-y-2">
                  {(course.chapters || []).map((chapter: any) => (
                    <div key={chapter.id} className="border rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-muted/30">
                        <span className="text-xs font-bold text-muted-foreground w-5">{chapter.order_index + 1}.</span>
                        <span className="font-medium text-sm flex-1">{chapter.title}</span>
                        <span className="text-xs text-muted-foreground">{chapter.lessons?.length || 0} leçon(s)</span>
                        <Button size="icon-sm" variant="ghost" onClick={() => { setSelectedCourse(course); setSelectedChapter(chapter); setLessonForm({ title: "", description: "", lesson_type: "text", content: "", file_url: "", duration: "" }); setShowLessonDialog(true); }}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="divide-y">
                        {(chapter.lessons || []).map((lesson: any) => {
                          const LIcon = lesson.lesson_type === 'video' ? Play : lesson.lesson_type === 'audio' ? Music : lesson.lesson_type === 'pdf' ? FileText : lesson.lesson_type === 'image' ? Image : BookOpen;
                          return (
                            <div key={lesson.id} className="flex items-center gap-3 px-3 py-2">
                              <LIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm flex-1">{lesson.title}</span>
                              <span className={`text-xs ${lesson.is_published ? 'text-green-600' : 'text-muted-foreground'}`}>{lesson.is_published ? '●' : '○'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setSelectedCourse(course); setChapterForm({ title: "", description: "" }); setShowChapterDialog(true); }}>
                    <Plus className="h-4 w-4" /> Ajouter un chapitre
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent><DialogHeader><DialogTitle>{selectedCourse ? "Modifier le cours" : "Nouveau cours"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveCourse} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Titre *</Label><Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Catégorie</Label><Input value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} placeholder="Ex: Signalisation" /></div>
              <div className="space-y-2"><Label>Niveau</Label>
                <Select value={courseForm.level} onValueChange={v => setCourseForm({...courseForm, level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="débutant">Débutant</SelectItem><SelectItem value="intermédiaire">Intermédiaire</SelectItem><SelectItem value="avancé">Avancé</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end"><Button type="button" variant="outline" onClick={() => setShowCourseDialog(false)}>Annuler</Button><Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : selectedCourse ? "Modifier" : "Créer"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
        <DialogContent><DialogHeader><DialogTitle>Ajouter un chapitre</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveChapter} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Titre du chapitre *</Label><Input value={chapterForm.title} onChange={e => setChapterForm({...chapterForm, title: e.target.value})} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={chapterForm.description} onChange={e => setChapterForm({...chapterForm, description: e.target.value})} rows={2} /></div>
            <div className="flex gap-3 justify-end"><Button type="button" variant="outline" onClick={() => setShowChapterDialog(false)}>Annuler</Button><Button type="submit" disabled={isPending}>{isPending ? "..." : "Ajouter"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Ajouter une leçon</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveLesson} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Titre *</Label><Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Type de leçon</Label>
                <Select value={lessonForm.lesson_type} onValueChange={v => setLessonForm({...lessonForm, lesson_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">📝 Texte</SelectItem>
                    <SelectItem value="video">🎬 Vidéo</SelectItem>
                    <SelectItem value="audio">🎵 Audio</SelectItem>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                    <SelectItem value="image">🖼️ Image</SelectItem>
                    <SelectItem value="animation">✨ Animation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Durée (secondes)</Label><Input type="number" value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} placeholder="Ex: 300" /></div>
              {lessonForm.lesson_type !== "text" && (
                <div className="space-y-2 col-span-2">
                  <Label>
                    {lessonForm.lesson_type === "video"
                      ? "URL de la Vidéo (MP4, YouTube, Vimeo)"
                      : lessonForm.lesson_type === "audio"
                      ? "URL de l'Enregistrement Audio (MP3, AAC, Podcast)"
                      : "URL du Fichier / Document"}
                  </Label>
                  <Input
                    value={lessonForm.file_url}
                    onChange={(e) => setLessonForm({ ...lessonForm, file_url: e.target.value })}
                    placeholder={
                      lessonForm.lesson_type === "video"
                        ? "https://exemples.com/cours-panneaux.mp4"
                        : lessonForm.lesson_type === "audio"
                        ? "https://exemples.com/cours-audio-priorites.mp3"
                        : "https://..."
                    }
                  />
                </div>
              )}
              <div className="space-y-2 col-span-2"><Label>Contenu / Description</Label><Textarea value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} rows={4} /></div>
            </div>
            <div className="flex gap-3 justify-end"><Button type="button" variant="outline" onClick={() => setShowLessonDialog(false)}>Annuler</Button><Button type="submit" disabled={isPending}>{isPending ? "..." : "Ajouter la leçon"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
