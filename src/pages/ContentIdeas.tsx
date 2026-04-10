import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon, MagnifyingGlassIcon, SparklesIcon,
  PlayIcon, ShareIcon, PaperAirplaneIcon, DocumentTextIcon,
  ViewColumnsIcon, ListBulletIcon,
} from '@heroicons/react/24/solid';
import { Loader2, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const platformIcons: Record<string, HeroIcon> = { youtube: PlayIcon, linkedin: ShareIcon, twitter: PaperAirplaneIcon };

const statusConfig: Record<string, { label: string; dot: string; text: string; badge: 'secondary' | 'info' | 'warning' | 'default' | 'violet' | 'success' }> = {
  idea:        { label: 'Idea',         dot: 'bg-slate-400',   text: 'text-slate-500',  badge: 'secondary' },
  researching: { label: 'Investigación', dot: 'bg-blue-500',   text: 'text-blue-600',   badge: 'info' },
  drafting:    { label: 'Borrador',     dot: 'bg-amber-500',   text: 'text-amber-600',  badge: 'warning' },
  review:      { label: 'Revisión',     dot: 'bg-orange-500',  text: 'text-orange-600', badge: 'default' },
  scheduled:   { label: 'Programado',   dot: 'bg-violet-500',  text: 'text-violet-600', badge: 'violet' },
  published:   { label: 'Publicado',    dot: 'bg-emerald-500', text: 'text-emerald-600', badge: 'success' },
};

const statuses = Object.keys(statusConfig);
const priorityLabels: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

export default function ContentIdeas() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPlatform, setNewPlatform] = useState('multi');
  const [newStatus, setNewStatus] = useState('idea');
  const [newPriority, setNewPriority] = useState('medium');
  const [newType, setNewType] = useState('tutorial');
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const fetchIdeas = async () => {
    const { data } = await supabase.from('content_ideas').select('*').order('created_at', { ascending: false });
    setIdeas(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIdeas(); }, []);

  const filtered = ideas.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const createIdea = async () => {
    if (!newTitle.trim()) { toast({ title: 'Ponele un título', variant: 'destructive' }); return; }
    const { error } = await supabase.from('content_ideas').insert({
      title: newTitle.trim(), description: newDesc, platform: newPlatform,
      status: newStatus, priority: newPriority, content_type: newType,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Idea creada' });
    setShowNew(false);
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewType('tutorial'); setNewPlatform('multi');
    fetchIdeas();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('content_ideas').update({ status }).eq('id', id);
    fetchIdeas();
    if (selectedIdea?.id === id) setSelectedIdea({ ...selectedIdea, status });
  };

  const updateIdea = async (id: string, updates: Record<string, any>) => {
    await supabase.from('content_ideas').update(updates).eq('id', id);
    fetchIdeas();
    if (selectedIdea?.id === id) setSelectedIdea({ ...selectedIdea, ...updates });
  };

  const generateIdea = async () => {
    setGeneratingIdea(true);
    try {
      const result = await api.generateIdea();
      if (result.idea) {
        await supabase.from('content_ideas').insert({
          title: result.idea.title, description: result.idea.description || '',
          key_message: result.idea.key_message || '', content_type: result.idea.content_type || 'hot_take',
          source: 'agent', status: 'idea', priority: 'medium', platform: 'multi',
        });
        toast({ title: 'Idea generada con AI', description: result.idea.title });
        fetchIdeas();
      }
    } catch (err: any) {
      toast({ title: 'Error al generar idea', description: err.message, variant: 'destructive' });
    } finally { setGeneratingIdea(false); }
  };

  const generateDraft = async (ideaId: string) => {
    setGeneratingDraft(ideaId);
    try {
      await api.generateDraft(ideaId);
      toast({ title: 'Borrador generado' });
      fetchIdeas();
      if (selectedIdea?.id === ideaId) {
        const { data } = await supabase.from('content_ideas').select('*').eq('id', ideaId).single();
        if (data) setSelectedIdea(data);
      }
    } catch (err: any) {
      toast({ title: 'Error al generar borrador', description: err.message, variant: 'destructive' });
    } finally { setGeneratingDraft(null); }
  };

  // Drag & Drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  const nextStatus = (s: string) => { const i = statuses.indexOf(s); return i < statuses.length - 1 ? statuses[i + 1] : null; };

  if (loading) return (
    <div className="space-y-4 max-w-[1200px]">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <div className="flex gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-48 rounded-xl" />)}</div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Ideas de Contenido</h1>
          <p className="text-muted-foreground text-[14px] mt-0.5">{ideas.length} ideas en pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateIdea} disabled={generatingIdea} size="sm" className="gap-1.5">
            {generatingIdea ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
            {generatingIdea ? 'Generando...' : 'Generar con AI'}
          </Button>
          <Button onClick={() => setShowNew(true)} size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" /> Nueva Idea
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input placeholder="Buscar ideas..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-muted rounded-xl p-0.5 border border-black/[0.06]">
          <button
            onClick={() => setView('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${view === 'kanban' ? 'bg-white border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.015)] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ViewColumnsIcon className="h-4 w-4" /> Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${view === 'list' ? 'bg-white border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.015)] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <ListBulletIcon className="h-4 w-4" /> Lista
          </button>
        </div>
      </div>

      {/* ===== KANBAN VIEW ===== */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {statuses.map((status) => {
            const cfg = statusConfig[status];
            const columnIdeas = filtered.filter(i => i.status === status);
            const isDragOver = dragOverColumn === status;
            return (
              <div key={status} className="flex flex-col min-w-[220px] w-[220px] shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={`text-[13px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                  <span className="text-[12px] text-muted-foreground/40 tabular-nums ml-auto">{columnIdeas.length}</span>
                </div>

                {/* Column drop zone */}
                <div
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status)}
                  className={`flex flex-col gap-2 flex-1 min-h-[160px] p-2 rounded-2xl transition-all duration-200 ${isDragOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/25 border border-dashed border-border/50'}`}
                >
                  {columnIdeas.map(idea => {
                    const IdeaIcon = platformIcons[idea.platform] || DocumentTextIcon;
                    return (
                      <div
                        key={idea.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, idea.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedIdea(idea)}
                        className={`bg-card border border-black/[0.12] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-grab active:cursor-grabbing group ${draggingId === idea.id ? 'opacity-40 scale-95' : ''}`}
                      >
                        <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{idea.title}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <IdeaIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                            <span className="text-[11px] text-muted-foreground/50 capitalize truncate">{idea.platform}</span>
                          </div>
                          {idea.priority === 'high' && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">Alta</span>
                          )}
                          {idea.priority === 'medium' && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Media</span>
                          )}
                        </div>
                        {idea.scheduled_date && (
                          <p className="text-[10px] text-muted-foreground/40 mt-1.5">{idea.scheduled_date}</p>
                        )}
                      </div>
                    );
                  })}

                  {/* Quick add */}
                  <button
                    onClick={() => { setNewStatus(status); setShowNew(true); }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border/40 text-[12px] text-muted-foreground/40 hover:text-muted-foreground hover:border-border hover:bg-card/50 transition-all duration-200"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {view === 'list' && (
        <div className="space-y-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <DocumentTextIcon className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-[14px] text-muted-foreground">No hay ideas de contenido</p>
            </div>
          ) : filtered.map(idea => {
            const Icon = platformIcons[idea.platform] || DocumentTextIcon;
            const cfg = statusConfig[idea.status] || statusConfig.idea;
            return (
              <div
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className="flex items-center gap-3.5 p-3.5 bg-card border border-black/[0.12] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate group-hover:text-primary transition-colors">{idea.title}</p>
                  <p className="text-[12px] text-muted-foreground/50 capitalize">{idea.content_type?.replace('_', ' ')} · {idea.platform}</p>
                </div>
                <Badge variant={cfg.badge} className="shrink-0">{cfg.label}</Badge>
                <span className={`text-[12px] font-medium capitalize ${idea.priority === 'high' ? 'text-red-500' : idea.priority === 'medium' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {priorityLabels[idea.priority] || idea.priority}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== NEW IDEA DIALOG ===== */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Idea de Contenido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
            <Textarea placeholder="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">X/Twitter</SelectItem>
                  <SelectItem value="multi">Multi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['tutorial', 'vlog', 'thread', 'hot_take', 'case_study', 'build_in_public', 'playbook'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createIdea()} disabled={!newTitle} className="w-full">Crear Idea</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL SHEET (right panel) ===== */}
      <Sheet open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto scrollbar-thin">
          {selectedIdea && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-[18px] font-bold leading-tight pr-6">{selectedIdea.title}</SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status + metadata */}
                <div className="space-y-4">
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
                    <Input
                      type="date"
                      value={selectedIdea.scheduled_date || ''}
                      onChange={(e) => updateIdea(selectedIdea.id, { scheduled_date: e.target.value || null })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Descripción</label>
                  <Textarea
                    value={selectedIdea.description || ''}
                    onChange={(e) => updateIdea(selectedIdea.id, { description: e.target.value })}
                    placeholder="Describí la idea..."
                    rows={3}
                  />
                </div>

                {selectedIdea.key_message && (
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Mensaje clave</label>
                    <p className="text-[14px] text-foreground/80">{selectedIdea.key_message}</p>
                  </div>
                )}

                {selectedIdea.target_audience && (
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Audiencia</label>
                    <p className="text-[14px] text-foreground/80">{selectedIdea.target_audience}</p>
                  </div>
                )}

                {/* Draft */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Borrador</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[12px] gap-1"
                      disabled={generatingDraft === selectedIdea.id}
                      onClick={() => generateDraft(selectedIdea.id)}
                    >
                      {generatingDraft === selectedIdea.id ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Generando...</>
                      ) : (
                        <><PenTool className="h-3 w-3" /> {selectedIdea.draft_content ? 'Re-generar' : 'Generar con AI'}</>
                      )}
                    </Button>
                  </div>
                  {selectedIdea.draft_content ? (
                    <div className="bg-muted/40 rounded-xl p-4 text-[13px] leading-relaxed max-h-64 overflow-auto scrollbar-thin whitespace-pre-wrap border border-border/40">
                      {selectedIdea.draft_content}
                    </div>
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
                      fetchIdeas();
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
    </motion.div>
  );
}
