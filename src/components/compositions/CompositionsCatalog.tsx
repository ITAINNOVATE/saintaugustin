"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, Clock, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import type { CompositionSubject, CompositionSession } from "@/types/database";

interface CompositionsCatalogProps {
  subjects: CompositionSubject[];
  userSessions?: CompositionSession[];
  studentId?: string;
}

export function CompositionsCatalog({ subjects }: CompositionsCatalogProps) {
  const [search, setSearch] = useState("");

  const filteredSubjects = subjects.filter((subj) =>
    !search ||
    subj.title.toLowerCase().includes(search.toLowerCase()) ||
    subj.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#0A1628] via-[#0F2A53] to-[#1E4070] text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-[#F5A623]">
        <div>
          <Badge className="bg-[#F5A623] text-[#0A1628] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            📝 Sujets de Composition
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold">Sujets d&apos;Examen Officiels ({subjects.length})</h1>
          <p className="text-white/80 text-sm mt-1">
            Choisissez un sujet ci-dessous pour lancer votre épreuve avec le boîtier de réponse.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un sujet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
          />
        </div>
      </div>

      {/* 46 Official Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSubjects.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-base">Aucun sujet trouvé</p>
          </Card>
        ) : (
          filteredSubjects.map((subj, idx) => {
            const numStr = (idx + 1).toString().padStart(2, "0");
            return (
              <Card
                key={subj.id}
                className="overflow-hidden border-2 border-border hover:border-[#F5A623] shadow-sm hover:shadow-xl transition-all rounded-3xl bg-card flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-[#0A1628] text-white dark:bg-[#F5A623] dark:text-[#0A1628] font-bold text-xs">
                      Sujet N°{numStr}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#F5A623]" /> 20 min
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-[#F5A623] transition-colors">
                      {subj.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Catégorie : <strong>Permis {subj.permit_category}</strong> • 20 Questions
                    </p>
                  </div>
                </CardContent>

                <div className="p-4 border-t bg-muted/20">
                  <Link href={`/apprenant/compositions/${subj.id}`}>
                    <Button className="w-full bg-[#0A1628] text-white hover:bg-[#1E4070] font-extrabold rounded-2xl py-5 text-sm gap-2 shadow-sm">
                      <Play className="h-4 w-4 text-[#F5A623] fill-[#F5A623]" /> Démarrer le Sujet
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
