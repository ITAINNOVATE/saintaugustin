"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  Search, UserPlus, Filter, Eye, Edit, Archive, Trash2,
  Users, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Calendar, Hash
} from "lucide-react";
import type { Student, UserRole } from "@/types/database";

interface StudentsManagementProps {
  students: (Student & { subscriptions?: Array<{ id: string; status: string; plan: string; end_date?: string }> })[];
  userRole: UserRole;
}

const ITEMS_PER_PAGE = 10;

export function StudentsManagement({ students: initialStudents, userRole }: StudentsManagementProps) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    birth_date: "", birth_place: "", gender: "", address: "", city: "",
    nationality: "Béninoise", notes: "",
  });

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (s.first_name || "").toLowerCase().includes(q) ||
      (s.last_name || "").toLowerCase().includes(q) ||
      (s.matricule || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(q);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetForm = () => setForm({
    first_name: "", last_name: "", email: "", phone: "",
    birth_date: "", birth_place: "", gender: "", address: "", city: "",
    nationality: "Béninoise", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload: any = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          date_of_birth: form.birth_date || null,
        };

        if (selectedStudent) {
          const { data, error } = await (supabase
            .from("students") as any)
            .update(payload)
            .eq("id", selectedStudent.id)
            .select()
            .single();
          if (error) throw error;

          // Sync with profiles table if user_id exists
          if (selectedStudent.user_id) {
            await (supabase.from("profiles") as any)
              .update({
                first_name: form.first_name,
                last_name: form.last_name,
                phone: form.phone || null,
              })
              .eq("id", selectedStudent.user_id);
          }

          setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, ...data } : s));
          toast({ title: "Apprenant modifié avec succès" });
        } else {
          const autoMatricule = `SA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
          const { data, error } = await (supabase
            .from("students") as any)
            .insert([{ ...payload, matricule: autoMatricule, status: "validated" }])
            .select()
            .single();
          if (error) throw error;
          setStudents(prev => [data, ...prev]);
          toast({ title: "Apprenant inscrit avec succès", description: `Matricule: ${data.matricule}` });
        }
        setShowForm(false);
        setSelectedStudent(null);
        resetForm();
      } catch (err: any) {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    startTransition(async () => {
      try {
        const { error } = await (supabase.from("students") as any).delete().eq("id", deleteStudent.id);
        if (error) throw error;

        if (deleteStudent.user_id) {
          await (supabase.from("profiles") as any).delete().eq("id", deleteStudent.user_id);
        }

        setStudents(prev => prev.filter(s => s.id !== deleteStudent.id));
        toast({ title: "Apprenant supprimé avec succès" });
        setDeleteStudent(null);
      } catch (err: any) {
        toast({ title: "Erreur lors de la suppression", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleArchive = async (student: Student) => {
    const nextStatus = student.status === "archived" ? "validated" : "archived";
    const { error } = await (supabase
      .from("students") as any)
      .update({ status: nextStatus })
      .eq("id", student.id);
    if (!error) {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: nextStatus as any } : s));
      toast({ title: student.status === "archived" ? "Apprenant réactivé" : "Apprenant archivé" });
    }
  };

  const handleValidate = async (student: Student) => {
    const { error } = await (supabase
      .from("students") as any)
      .update({ status: "validated" })
      .eq("id", student.id);
    if (!error) {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: "validated" as any } : s));
      toast({ title: "Inscription validée" });
    }
  };

  const openEdit = (student: Student) => {
    setSelectedStudent(student);
    setForm({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      email: student.email || "",
      phone: student.phone || "",
      birth_date: (student as any).date_of_birth || student.birth_date || "",
      birth_place: (student as any).birth_place || "",
      gender: (student as any).gender || "",
      address: student.address || "",
      city: (student as any).city || "",
      nationality: (student as any).nationality || "Béninoise",
      notes: (student as any).notes || "",
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Inscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">{students.length} apprenant(s) au total</p>
        </div>
        <Button
          onClick={() => { setSelectedStudent(null); resetForm(); setShowForm(true); }}
          className="bg-[#0A1628] hover:bg-[#1E4070] gap-2"
        >
          <UserPlus className="h-4 w-4" /> Nouvel apprenant
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, matricule, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="validated">Validés</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apprenant</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Matricule</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date d&apos;inscription</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Aucun apprenant trouvé</p>
                  </td>
                </tr>
              ) : paginated.map((student) => (
                <tr key={student.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0A1628] dark:bg-[#1E4070] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {(student.first_name?.[0] || "A")}{(student.last_name?.[0] || "P")}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{student.matricule || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{student.matricule || "N/A"}</code>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {student.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</p>}
                      {student.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${getStatusColor(student.status)}`}>{getStatusLabel(student.status)}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-xs text-muted-foreground">{formatDate(student.created_at)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewStudent(student)} title="Voir"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(student)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                      {student.status === "pending" && (
                        <Button variant="ghost" size="icon" onClick={() => handleValidate(student)} title="Valider" className="text-green-600 hover:text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleArchive(student)} title="Archiver/Réactiver" className="text-orange-500 hover:text-orange-600">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteStudent(student)} title="Supprimer" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? "Modifier l'apprenant" : "Nouvel apprenant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input id="first_name" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input id="last_name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place">Lieu de naissance</Label>
                <Input id="birth_place" value={form.birth_place} onChange={e => setForm({...form, birth_place: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Genre</Label>
                <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input id="nationality" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="bg-[#0A1628] hover:bg-[#1E4070]">
                {isPending ? "Enregistrement..." : selectedStudent ? "Modifier" : "Inscrire"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Fiche Apprenant</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0A1628] text-white flex items-center justify-center text-2xl font-bold">
                  {viewStudent.first_name[0]}{viewStudent.last_name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewStudent.first_name} {viewStudent.last_name}</h3>
                  <code className="text-sm text-[#F5A623] font-mono">{viewStudent.matricule}</code>
                  <span className={`ml-2 badge ${getStatusColor(viewStudent.status)}`}>{getStatusLabel(viewStudent.status)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Phone, label: "Téléphone", value: viewStudent.phone },
                  { icon: Mail, label: "Email", value: viewStudent.email },
                  { icon: Calendar, label: "Naissance", value: viewStudent.birth_date ? formatDate(viewStudent.birth_date) : null },
                  { icon: MapPin, label: "Ville", value: viewStudent.city },
                  { icon: Hash, label: "Genre", value: viewStudent.gender === "M" ? "Masculin" : viewStudent.gender === "F" ? "Féminin" : null },
                  { icon: Calendar, label: "Inscrit le", value: formatDate(viewStudent.created_at) },
                ].map(({ icon: Icon, label, value }) => value ? (
                  <div key={label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Supprimer l'apprenant ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer définitivement l'apprenant{" "}
              <strong className="text-foreground">{deleteStudent?.first_name} {deleteStudent?.last_name}</strong> ({deleteStudent?.matricule || "sans matricule"}) ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteStudent(null)}>Annuler</Button>
              <Button
                variant="destructive"
                onClick={handleDeleteStudent}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 font-bold"
              >
                {isPending ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
