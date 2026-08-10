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
import { formatDate } from "@/lib/utils";
import { IdCard, Plus, Search, Eye, Download, User, Calendar, Hash, MapPin, FileText } from "lucide-react";
import type { LearnerPermit, UserRole } from "@/types/database";

type PermitWithStudent = LearnerPermit & {
  students?: { id: string; first_name: string; last_name: string; matricule: string } | null;
};

interface PermisManagementProps {
  permits: PermitWithStudent[];
  adminId: string;
  userRole: UserRole;
}

const PERMIT_CATEGORIES = ["A", "A1", "A2", "B", "B1", "C", "C1", "D", "D1", "E", "F"];

export function PermisManagement({ permits: initialPermits, adminId, userRole }: PermisManagementProps) {
  const [permits, setPermits] = useState(initialPermits);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [viewPermit, setViewPermit] = useState<PermitWithStudent | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const supabase = createClient();

  const [form, setForm] = useState({
    studentSearch: "", studentId: "", studentName: "",
    permit_number: "", categories: [] as string[],
    issue_date: "", delivery_date: "", expiry_date: "",
    issuing_center: "", scan_url: "", observations: ""
  });
  const [foundStudents, setFoundStudents] = useState<any[]>([]);

  const filtered = permits.filter(p => {
    const q = search.toLowerCase();
    const name = `${p.students?.first_name || ""} ${p.students?.last_name || ""}`.toLowerCase();
    return !q || name.includes(q) || p.permit_number.toLowerCase().includes(q) || (p.students?.matricule || "").toLowerCase().includes(q);
  });

  const searchStudents = async (q: string) => {
    if (q.length < 2) { setFoundStudents([]); return; }
    const { data } = await supabase.from("students").select("id, first_name, last_name, matricule").or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,matricule.ilike.%${q}%`).limit(5);
    setFoundStudents(data || []);
  };

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) { toast({ title: "Sélectionnez un apprenant", variant: "destructive" }); return; }
    if (!form.permit_number || !form.issue_date) { toast({ title: "Numéro de permis et date d'obtention requis", variant: "destructive" }); return; }
    startTransition(async () => {
      const { data, error } = await (supabase.from("learner_permits") as any).insert([{
        student_id: form.studentId, permit_number: form.permit_number,
        categories: form.categories as any, issue_date: form.issue_date,
        delivery_date: form.delivery_date || null, expiry_date: form.expiry_date || null,
        issuing_center: form.issuing_center || null, scan_url: form.scan_url || null,
        observations: form.observations || null, registered_by: adminId
      }]).select("*, students(id, first_name, last_name, matricule)").single();
      if (!error && data) {
        setPermits(prev => [data as any, ...prev]);
        toast({ title: "Permis enregistré avec succès" });
        setShowDialog(false);
        setForm({ studentSearch: "", studentId: "", studentName: "", permit_number: "", categories: [], issue_date: "", delivery_date: "", expiry_date: "", issuing_center: "", scan_url: "", observations: "" });
      } else toast({ title: "Erreur", description: error?.message, variant: "destructive" });
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Permis Délivrés</h1><p className="text-muted-foreground text-sm">{permits.length} permis enregistré(s)</p></div>
        <Button onClick={() => setShowDialog(true)} className="bg-[#0A1628] hover:bg-[#1E4070] gap-2"><Plus className="h-4 w-4" />Enregistrer un permis</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, numéro de permis..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full"><Card><CardContent className="py-12 text-center text-muted-foreground"><IdCard className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>Aucun permis enregistré</p></CardContent></Card></div>
        ) : filtered.map(permit => (
          <Card key={permit.id} className="hover:shadow-card-hover transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center">
                    <IdCard className="h-5 w-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{permit.students?.first_name} {permit.students?.last_name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{permit.students?.matricule}</p>
                  </div>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => setViewPermit(permit)}><Eye className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono font-semibold">{permit.permit_number}</span>
                </div>
                {permit.categories && permit.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {permit.categories.map(cat => (
                      <span key={cat} className="px-2 py-0.5 bg-[#0A1628] text-white text-xs rounded-md font-bold">{cat}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Obtenu le {formatDate(permit.issue_date)}
                </div>
                {permit.issuing_center && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{permit.issuing_center}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Permit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enregistrer un permis</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Apprenant *</Label>
              <Input placeholder="Rechercher par nom ou matricule..." value={form.studentSearch}
                onChange={e => { setForm({ ...form, studentSearch: e.target.value, studentId: "", studentName: "" }); searchStudents(e.target.value); }} />
              {foundStudents.length > 0 && !form.studentId && (
                <div className="border rounded-lg overflow-hidden">
                  {foundStudents.map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                      onClick={() => { setForm({ ...form, studentId: s.id, studentName: `${s.first_name} ${s.last_name}`, studentSearch: `${s.first_name} ${s.last_name} (${s.matricule})` }); setFoundStudents([]); }}>
                      <User className="h-3 w-3" />{s.first_name} {s.last_name} — <span className="font-mono text-xs">{s.matricule}</span>
                    </button>
                  ))}
                </div>
              )}
              {form.studentId && <p className="text-xs text-green-600">✓ {form.studentName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Numéro du permis *</Label>
              <Input value={form.permit_number} onChange={e => setForm({ ...form, permit_number: e.target.value })} placeholder="Ex: BJ-2024-00123" required />
            </div>
            <div className="space-y-2">
              <Label>Catégorie(s)</Label>
              <div className="flex flex-wrap gap-2">
                {PERMIT_CATEGORIES.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      form.categories.includes(cat)
                        ? "bg-[#0A1628] text-white border-[#0A1628]"
                        : "bg-background text-foreground border-border hover:border-[#0A1628]"
                    }`}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date d'obtention *</Label><Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Date de délivrance</Label><Input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Date d'expiration</Label><Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Centre de délivrance</Label><Input value={form.issuing_center} onChange={e => setForm({ ...form, issuing_center: e.target.value })} placeholder="Ex: Préfecture Cotonou" /></div>
            </div>
            <div className="space-y-2">
              <Label>Fichier du scan (PDF ou image)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setForm({ ...form, scan_url: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#0A1628] file:text-white hover:file:bg-[#1E4070] text-sm cursor-pointer"
              />
              {form.scan_url && <p className="text-xs text-green-600">Fichier chargé pour le permis.</p>}
            </div>
            <div className="space-y-2"><Label>Observations</Label><Textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={2} /></div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending} className="bg-[#0A1628] hover:bg-[#1E4070]">{isPending ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Permit Dialog */}
      <Dialog open={!!viewPermit} onOpenChange={() => setViewPermit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Détails du permis</DialogTitle></DialogHeader>
          {viewPermit && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
                <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center"><IdCard className="h-7 w-7 text-[#F5A623]" /></div>
                <div>
                  <p className="font-bold">{viewPermit.students?.first_name} {viewPermit.students?.last_name}</p>
                  <p className="font-mono text-sm text-[#F5A623] font-semibold">{viewPermit.permit_number}</p>
                  <div className="flex gap-1 mt-1">{viewPermit.categories?.map(c => <span key={c} className="px-1.5 py-0.5 bg-[#0A1628] text-white text-xs rounded font-bold">{c}</span>)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Date d'obtention", value: formatDate(viewPermit.issue_date) },
                  { label: "Date de délivrance", value: viewPermit.delivery_date ? formatDate(viewPermit.delivery_date) : "—" },
                  { label: "Expiration", value: viewPermit.expiry_date ? formatDate(viewPermit.expiry_date) : "—" },
                  { label: "Centre", value: viewPermit.issuing_center || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-muted/40 rounded-lg"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold mt-0.5">{value}</p></div>
                ))}
              </div>
              {viewPermit.observations && <div className="p-3 bg-muted/40 rounded-lg text-sm"><p className="text-xs text-muted-foreground mb-1">Observations</p><p>{viewPermit.observations}</p></div>}
              {viewPermit.scan_url && <a href={viewPermit.scan_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" />Télécharger le scan</Button></a>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
