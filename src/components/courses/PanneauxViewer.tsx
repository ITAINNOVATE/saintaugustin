"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Grid,
  Play,
  Pause,
  ArrowLeft,
  Info,
  Award,
  Volume2,
  VolumeX,
} from "lucide-react";
import panneauxData from "@/data/panneaux.json";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Panneau {
  id: number;
  category: string;
  title: string;
  description: string;
  image: string;
}

export function PanneauxViewer() {
  const panels: Panneau[] = panneauxData;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const currentPanneau = panels[currentIndex] || panels[0];
  const progressPercent = Math.round(((currentIndex + 1) / panels.length) * 100);

  // Soft Web Audio API sound chime generator
  const playPageFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Soft warm chime notes C5 (523Hz) -> E5 (659Hz)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // Very soft background volume
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !completed) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= panels.length - 1) {
            setIsPlaying(false);
            setCompleted(true);
            return prev;
          }
          playPageFlipSound();
          return prev + 1;
        });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, completed, panels.length, soundEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGrid) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, showGrid]);

  const handleNext = () => {
    playPageFlipSound();
    if (currentIndex < panels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    playPageFlipSound();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCompleted(false);
    }
  };

  const handleSelectPanel = (index: number) => {
    playPageFlipSound();
    setCurrentIndex(index);
    setShowGrid(false);
    setCompleted(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCompleted(false);
    setIsPlaying(false);
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] max-w-4xl mx-auto flex flex-col justify-between overflow-hidden p-1 sm:p-3 space-y-2 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 bg-card px-4 py-2.5 rounded-2xl border shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Link href="/apprenant/cours">
            <Button variant="ghost" size="icon-sm" className="rounded-xl h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider">
                Cours N°1
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">• {currentIndex + 1} / {panels.length} ({progressPercent}%)</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">Lecture des Panneaux</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-xl gap-1.5 text-xs font-semibold h-8 px-2.5"
            title={soundEnabled ? "Désactiver le son" : "Activer le son"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#F5A623]" />
                <span className="hidden sm:inline">Son</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Muet</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGrid(true)}
            className="rounded-xl gap-1.5 text-xs font-semibold h-8 px-3"
          >
            <Grid className="h-3.5 w-3.5" /> Grille
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-xl gap-1.5 text-xs font-semibold h-8 px-3"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-500" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-green-500" /> Auto
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <Progress value={progressPercent} className="h-1.5 rounded-full flex-shrink-0" />

      {/* MAIN PANNEAU DISPLAY CARD - FITS REMAINING HEIGHT */}
      <Card className="flex-1 flex flex-col justify-between border-2 border-border shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-[#0A1628] min-h-0">
        {/* Category Header */}
        <div className="px-4 py-2 bg-muted/40 border-b flex items-center justify-between flex-shrink-0">
          <Badge
            variant="secondary"
            className="bg-[#0A1628] text-white dark:bg-[#F5A623] dark:text-[#0A1628] font-bold text-[11px] px-2.5 py-0.5 rounded-md truncate max-w-[70%]"
          >
            {currentPanneau.category || "Panneau de signalisation"}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground font-semibold flex-shrink-0">
            N° {currentPanneau.id} / {panels.length}
          </span>
        </div>

        {/* CENTER CONTENT AREA */}
        <CardContent className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 text-center overflow-hidden min-h-0 space-y-3">
          {/* PANNEAU IMAGE CONTAINER */}
          <div className="relative w-full max-w-md h-[40vh] max-h-[310px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center p-3 shadow-inner group flex-shrink">
            <img
              src={currentPanneau.image}
              alt={currentPanneau.title}
              className="max-h-full max-w-full object-contain drop-shadow-md transition-all duration-200"
            />
          </div>

          {/* MEANING & TITLE BELOW IMAGE */}
          <div className="space-y-1.5 max-w-xl flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight line-clamp-1">
              {currentPanneau.title}
            </h2>
            <div className="px-3 py-2 bg-muted/50 dark:bg-[#0F2A53]/40 border rounded-xl text-xs sm:text-sm text-muted-foreground leading-snug font-medium line-clamp-3">
              <Info className="h-4 w-4 text-[#F5A623] inline-block mr-1.5 -mt-0.5 flex-shrink-0" />
              {currentPanneau.description}
            </div>
          </div>
        </CardContent>

        {/* BOTTOM NAVIGATION FOOTER */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between flex-shrink-0">
          <Button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
            className="rounded-xl px-4 font-semibold gap-1.5 h-9"
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </Button>

          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline-block">
            Boutons ← / →
          </span>

          <Button
            onClick={handleNext}
            size="sm"
            className="bg-[#F5A623] text-[#0A1628] hover:bg-[#F9CC74] rounded-xl px-6 font-bold gap-1.5 shadow-gold text-sm h-9"
          >
            {currentIndex === panels.length - 1 ? (
              <>
                Terminer <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Suivant <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* COMPLETED CELEBRATION MODAL */}
      {completed && (
        <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-emerald-950/40 dark:to-slate-900 border-2 border-green-300 dark:border-green-800 rounded-3xl shadow-2xl animate-fade-in space-y-4">
          <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Award className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Félicitations ! 🎉</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vous avez étudié avec succès les <strong>{panels.length} panneaux</strong> du cours de signalisation routière.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button onClick={handleRestart} variant="outline" className="rounded-xl gap-2">
              <RotateCcw className="h-4 w-4" /> Recommencer le cours
            </Button>
            <Link href="/apprenant/cours">
              <Button className="bg-[#0A1628] text-white rounded-xl gap-2">
                Retour aux cours <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* GRID SELECTOR DIALOG */}
      <Dialog open={showGrid} onOpenChange={setShowGrid}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Grid className="h-5 w-5 text-[#F5A623]" /> Liste des {panels.length} Panneaux
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {panels.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handleSelectPanel(idx)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center gap-2 hover:scale-[1.03] cursor-pointer ${
                  idx === currentIndex
                    ? "border-2 border-[#F5A623] bg-[#F5A623]/10 font-bold"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="w-16 h-16 flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-xl border">
                  <img src={p.image} alt={p.title} className="max-h-full max-w-full object-contain" />
                </div>
                <span className="text-xs font-semibold text-center line-clamp-2">{p.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground">#{p.id}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
