import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  LightBulbIcon, CalendarIcon, UserGroupIcon, CpuChipIcon,
  CalendarDaysIcon, EyeIcon, DocumentTextIcon, RocketLaunchIcon,
  PaperAirplaneIcon, ShareIcon, PlayIcon, PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { Loader2, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; badge: 'secondary' | 'info' | 'warning' | 'default' | 'violet' | 'success' }> = {
  idea:        { label: 'Idea',         dot: 'bg-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-500',  badge: 'secondary' },
  researching: { label: 'Investigación', dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-600',   badge: 'info' },
  drafting:    { label: 'Borrador',     dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-600',  badge: 'warning' },
  review:      { label: 'Revisión',     dot: 'bg-orange-500',  bg: 'bg-orange-50',  text: 'text-orange-600', badge: 'default' },
  scheduled:   { label: 'Programado',   dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-600', badge: 'violet' },
  published:   { label: 'Publicado',    dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'success' },
};

const platformIcons: Record<string, HeroIcon> = {
  youtube: PlayIcon, linkedin: ShareIcon, twitter: PaperAirplaneIcon,
};

const statuses = Object.keys(statusConfig);
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } };

export default function Dashboard() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [competitorContent, setCompetitorContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const fetchData = () => {
    Promise.all([
      supabase.from('content_ideas').select('*').order('created_at', { ascending: false }),
      supabase.from('competitors').select('*').eq('is_active', true),
      supabase.from('competitor_content').select('*, competitors(name, avatar_url)').order('created_at', { ascending: false }).limit(6),
    ]).then(([ideasRes, compRes, contentRes]) => {
      setIdeas(ideasRes.data || []);
      setCompetitors(compRes.data || []);
      setCompetitorContent(contentRes.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const thisWeek = ideas.filter(i => i.scheduled_date && i.status !== 'published');

  // Drag & Drop
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragIdRef.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragEnd = () => { setDraggingId(null); setDragOverColumn(null); };
  const onDragOver = (e: React.DragEvent, status: string) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColumn(status); };
  const onDragLeave = () => { setDragOverColumn(null); };
  const onDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (dragIdRef.current) {
      updateStatus(dragIdRef.current, status);
      dragIdRef.current = null;
    }
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const updateStatus = async (id: string, status: string) => {
    // Optimistic: move instantly in UI
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selectedIdea?.id === id) setSelectedIdea((prev: any) => prev ? { ...prev, status } : prev);
    // Sync with DB in background
    supabase.from('content_ideas').update({ status }).eq('id', id);
  };

  const updateIdea = async (id: string, updates: Record<string, any>) => {
    await supabase.from('content_ideas').update(updates).eq('id', id);
    fetchData();
    if (selectedIdea?.id === id) setSelectedIdea({ ...selectedIdea, ...updates });
  };

  const generateDraft = async (ideaId: string) => {
    setGeneratingDraft(ideaId);
    try {
      await api.generateDraft(ideaId);
      toast({ title: 'Borrador generado' });
      fetchData();
      if (selectedIdea?.id === ideaId) {
        const { data } = await supabase.from('content_ideas').select('*').eq('id', ideaId).single();
        if (data) setSelectedIdea(data);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setGeneratingDraft(null); }
  };

  const nextStatus = (s: string) => { const i = statuses.indexOf(s); return i < statuses.length - 1 ? statuses[i + 1] : null; };

  if (loading) {
    return (
      <div className="space-y-8 max-w-[1100px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const stats = [
    { label: 'Ideas en Pipeline', value: ideas.length, icon: LightBulbIcon, iconBg: 'bg-gradient-to-b from-orange-400 to-orange-600', iconColor: 'text-white', borderColor: 'border-orange-600' },
    { label: 'Programado', value: thisWeek.length, icon: CalendarIcon, iconBg: 'bg-gradient-to-b from-blue-400 to-blue-600', iconColor: 'text-white', borderColor: 'border-blue-600' },
    { label: 'Competidores', value: competitors.length, icon: UserGroupIcon, iconBg: 'bg-gradient-to-b from-emerald-400 to-emerald-600', iconColor: 'text-white', borderColor: 'border-emerald-600' },
    { label: 'Sugerencias agente', value: 0, icon: CpuChipIcon, iconBg: 'bg-gradient-to-b from-violet-400 to-violet-600', iconColor: 'text-white', borderColor: 'border-violet-600' },
  ];

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1100px]">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Panel</h1>
          <p className="text-muted-foreground text-[14px] mt-0.5">Tu operación de contenido de un vistazo</p>
        </div>
        <Link to="/ideas">
          <Button size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" /> Nueva Idea
          </Button>
        </Link>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-0">
              <CardContent className="p-5">
                <div className={`w-11 h-11 rounded-2xl ${stat.iconBg} flex items-center justify-center mb-4 border ${stat.borderColor} brightness-110 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.1)]`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <p className="text-[28px] font-bold tracking-tight tabular-nums leading-none">{stat.value}</p>
                <p className="text-[13px] text-muted-foreground mt-1.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Pipeline — Kanban with drag & drop */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Pipeline de Contenido</h2>
          <Link to="/ideas">
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground">Ver todo</Button>
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {statuses.map((status) => {
            const cfg = statusConfig[status];
            const columnIdeas = ideas.filter(i => i.status === status);
            const isDragOver = dragOverColumn === status;
            return (
              <div key={status} className="flex flex-col min-w-[185px] w-[185px] shrink-0">
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-[13px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-[12px] text-muted-foreground/40 tabular-nums ml-auto">{columnIdeas.length}</span>
                </div>
                <div
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status)}
                  className={`flex flex-col gap-2 min-h-[120px] p-1.5 rounded-xl transition-all duration-200 ${isDragOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/25 border border-dashed border-border/50'}`}
                >
                  {columnIdeas.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[12px] text-muted-foreground/30">Vacío</span>
                    </div>
                  ) : columnIdeas.slice(0, 4).map(idea => {
                    const IdeaIcon = platformIcons[idea.platform] || DocumentTextIcon;
                    return (
                      <div
                        key={idea.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, idea.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedIdea(idea)}
                        className={`bg-card border border-black/[0.12] rounded-xl p-3 shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-grab active:cursor-grabbing group ${draggingId === idea.id ? 'opacity-40 scale-95' : ''}`}
                      >
                        <p className="text-[13px] font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{idea.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <IdeaIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
                          {idea.priority === 'high' && <span className="text-[10px] font-semibold text-red-500">Alta</span>}
                          {idea.scheduled_date && <span className="text-[10px] text-muted-foreground/50 ml-auto">{idea.scheduled_date}</span>}
                        </div>
                      </div>
                    );
                  })}
                  {columnIdeas.length > 4 && (
                    <span className="text-[11px] text-muted-foreground/40 text-center py-1">+{columnIdeas.length - 4} más</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Two Column: Schedule + Competitor Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[15px] font-semibold">Esta semana</CardTitle>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground">Ver Calendario</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {thisWeek.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <CalendarDaysIcon className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-[14px] font-medium text-muted-foreground mb-1">Nada programado</p>
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Agregá ideas al calendario</p>
                  <Link to="/ideas"><Button variant="outline" size="sm">Programar contenido</Button></Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {thisWeek.map(idea => {
                    const Icon = platformIcons[idea.platform] || DocumentTextIcon;
                    const cfg = statusConfig[idea.status] || statusConfig.idea;
                    return (
                      <div key={idea.id} onClick={() => setSelectedIdea(idea)} className="flex items-center gap-3.5 p-3 -mx-1 rounded-xl hover:bg-accent/50 transition-colors duration-150 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium truncate">{idea.title}</p>
                          <p className="text-[12px] text-muted-foreground">{idea.scheduled_date}</p>
                        </div>
                        <Badge variant={cfg.badge} className="shrink-0">{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[15px] font-semibold">Pulso Competidores</CardTitle>
              <Link to="/competitors/content">
                <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground">Ver Todo</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {competitorContent.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <EyeIcon className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-[14px] font-medium text-muted-foreground mb-1">Sin contenido aún</p>
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Registrá contenido de competidores</p>
                  <Link to="/competitors/content"><Button variant="outline" size="sm">Registrar contenido</Button></Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {competitorContent.map(c => {
                    const Icon = platformIcons[c.platform] || DocumentTextIcon;
                    return (
                      <div key={c.id} className="flex items-center gap-3.5 p-3 -mx-1 rounded-xl hover:bg-accent/50 transition-colors duration-150">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium truncate">{c.title}</p>
                          <p className="text-[12px] text-muted-foreground">{(c as any).competitors?.name}</p>
                        </div>
                        {c.is_analyzed && <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Link to="/competitors/content">
          <Button variant="outline" size="sm" className="gap-1.5">
            <DocumentTextIcon className="h-4 w-4" /> Registrar Contenido
          </Button>
        </Link>
        <Link to="/briefs">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RocketLaunchIcon className="h-4 w-4" /> Generar Brief
          </Button>
        </Link>
      </motion.div>
    </motion.div>

    {/* ===== DETAIL SHEET ===== */}
    <Sheet open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
      <SheetContent className="sm:max-w-md overflow-y-auto scrollbar-thin">
        {selectedIdea && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-[18px] font-bold leading-tight pr-6">{selectedIdea.title}</SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
              {/* Status pills */}
              <div>
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Estado</label>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map(s => {
                    const cfg = statusConfig[s];
                    const isActive = selectedIdea.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selectedIdea.id, s)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${isActive ? 'bg-card border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.015)] text-foreground' : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Plataforma</label>
                  <Select value={selectedIdea.platform} onValueChange={(v) => updateIdea(selectedIdea.id, { platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">X/Twitter</SelectItem>
                      <SelectItem value="multi">Multi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Prioridad</label>
                  <Select value={selectedIdea.priority} onValueChange={(v) => updateIdea(selectedIdea.id, { priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Fecha programada</label>
                <Input type="date" value={selectedIdea.scheduled_date || ''} onChange={(e) => updateIdea(selectedIdea.id, { scheduled_date: e.target.value || null })} />
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Descripción</label>
                <Textarea value={selectedIdea.description || ''} onChange={(e) => updateIdea(selectedIdea.id, { description: e.target.value })} placeholder="Describí la idea..." rows={3} />
              </div>

              {/* Draft */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Borrador</label>
                  <Button variant="ghost" size="sm" className="h-7 text-[12px] gap-1" disabled={generatingDraft === selectedIdea.id} onClick={() => generateDraft(selectedIdea.id)}>
                    {generatingDraft === selectedIdea.id ? <><Loader2 className="h-3 w-3 animate-spin" /> Generando...</> : <><PenTool className="h-3 w-3" /> {selectedIdea.draft_content ? 'Re-generar' : 'Generar con AI'}</>}
                  </Button>
                </div>
                {selectedIdea.draft_content ? (
                  <div className="bg-muted/40 rounded-xl p-4 text-[13px] leading-relaxed max-h-64 overflow-auto scrollbar-thin whitespace-pre-wrap border border-border/40">{selectedIdea.draft_content}</div>
                ) : (
                  <div className="bg-muted/20 rounded-xl p-6 text-center border border-dashed border-border/40">
                    <PenTool className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground/40">Sin borrador todavía</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border/40">
                {nextStatus(selectedIdea.status) && (
                  <Button onClick={() => updateStatus(selectedIdea.id, nextStatus(selectedIdea.status)!)} className="flex-1 gap-1.5">
                    Mover a {statusConfig[nextStatus(selectedIdea.status)!]?.label}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    await supabase.from('content_ideas').delete().eq('id', selectedIdea.id);
                    setSelectedIdea(null);
                    fetchData();
                    toast({ title: 'Idea eliminada' });
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
