import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon, DocumentTextIcon, PlayIcon, ShareIcon, PaperAirplaneIcon,
} from '@heroicons/react/24/solid';
import { Loader2, PenTool, BarChart3, Eye, Heart, MessageCircle, Share2, Bookmark, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Label } from '@/components/ui/label';
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

export const kanbanStatuses = Object.keys(statusConfig);
export { statusConfig };

interface KanbanBoardProps {
  ideas: any[];
  setIdeas: React.Dispatch<React.SetStateAction<any[]>>;
  /** Column width — smaller for dashboard, wider for full page */
  columnWidth?: number;
  /** Max cards per column before "+X más" — 0 for unlimited */
  maxCards?: number;
  /** Show quick add button per column */
  showQuickAdd?: boolean;
  /** Called when quick add is clicked with the target status */
  onQuickAdd?: (status: string) => void;
}

export function KanbanBoard({ ideas, setIdeas, columnWidth = 220, maxCards = 0, showQuickAdd = false, onQuickAdd }: KanbanBoardProps) {
  const { toast } = useToast();
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ status: string; index: number } | null>(null);
  const dragIdRef = useRef<string | null>(null);

  // --- Drag & Drop ---
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragIdRef.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragEnd = () => { setDraggingId(null); setDragOverColumn(null); setDropTarget(null); };

  const onCardDragOver = (e: React.DragEvent, status: string, index: number) => {
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
    setDropTarget({ status, index });
  };

  const onColumnDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
    if (!dropTarget || dropTarget.status !== status) {
      setDropTarget({ status, index: ideas.filter(i => i.status === status).length });
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverColumn(null); setDropTarget(null);
    }
  };

  const onDrop = (e: React.DragEvent, status: string, targetIndex?: number) => {
    e.preventDefault();
    if (!dragIdRef.current) return;
    const draggedId = dragIdRef.current;
    const draggedIdea = ideas.find(i => i.id === draggedId);
    if (!draggedIdea) return;

    const newIdeas = ideas.filter(i => i.id !== draggedId);
    const updatedIdea = { ...draggedIdea, status };
    const columnIdeas = newIdeas.filter(i => i.status === status);
    const insertIdx = targetIndex !== undefined ? Math.min(targetIndex, columnIdeas.length) : columnIdeas.length;
    const otherIdeas = newIdeas.filter(i => i.status !== status);
    const newColumn = [...columnIdeas];
    newColumn.splice(insertIdx, 0, updatedIdea);
    setIdeas([...otherIdeas, ...newColumn]);

    if (draggedIdea.status !== status) {
      supabase.from('content_ideas').update({ status }).eq('id', draggedId);
    }

    dragIdRef.current = null;
    setDraggingId(null); setDragOverColumn(null); setDropTarget(null);
  };

  // --- Actions ---
  const updateStatus = async (id: string, status: string) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selectedIdea?.id === id) setSelectedIdea((prev: any) => prev ? { ...prev, status } : prev);
    supabase.from('content_ideas').update({ status }).eq('id', id);
  };

  const updateIdea = async (id: string, updates: Record<string, any>) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (selectedIdea?.id === id) setSelectedIdea((prev: any) => prev ? { ...prev, ...updates } : prev);
    supabase.from('content_ideas').update(updates).eq('id', id);
  };

  const generateDraft = async (ideaId: string) => {
    setGeneratingDraft(ideaId);
    try {
      await api.generateDraft(ideaId);
      toast({ title: 'Borrador generado' });
      const { data } = await supabase.from('content_ideas').select('*').eq('id', ideaId).single();
      if (data) {
        setIdeas(prev => prev.map(i => i.id === ideaId ? data : i));
        if (selectedIdea?.id === ideaId) setSelectedIdea(data);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setGeneratingDraft(null); }
  };

  const deleteIdea = async (id: string) => {
    await supabase.from('content_ideas').delete().eq('id', id);
    setIdeas(prev => prev.filter(i => i.id !== id));
    setSelectedIdea(null);
    toast({ title: 'Idea eliminada' });
  };

  const nextStatus = (s: string) => { const i = kanbanStatuses.indexOf(s); return i < kanbanStatuses.length - 1 ? kanbanStatuses[i + 1] : null; };

  return (
    <>
      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {kanbanStatuses.map((status) => {
          const cfg = statusConfig[status];
          const columnIdeas = ideas.filter(i => i.status === status);
          const isDragOver = dragOverColumn === status;
          const visibleIdeas = maxCards > 0 ? columnIdeas.slice(0, maxCards) : columnIdeas;
          const hiddenCount = maxCards > 0 ? Math.max(0, columnIdeas.length - maxCards) : 0;

          return (
            <div key={status} className="flex flex-col shrink-0" style={{ minWidth: columnWidth, width: columnWidth }}>
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[13px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                <span className="text-[12px] text-muted-foreground/40 tabular-nums ml-auto">{columnIdeas.length}</span>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => onColumnDragOver(e, status)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, status, columnIdeas.length)}
                className={`flex flex-col flex-1 min-h-[200px] p-2 rounded-2xl transition-all duration-200 ${isDragOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/25 border border-dashed border-border/50'}`}
              >
                {visibleIdeas.map((idea, idx) => {
                  const IdeaIcon = platformIcons[idea.platform] || DocumentTextIcon;
                  const showIndicatorAbove = dropTarget?.status === status && dropTarget.index === idx && draggingId !== idea.id;
                  return (
                    <div key={idea.id}>
                      {showIndicatorAbove && <div className="h-1 mx-1 mb-1 rounded-full bg-primary/60" />}
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, idea.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          onCardDragOver(e, status, e.clientY < rect.top + rect.height / 2 ? idx : idx + 1);
                        }}
                        onDrop={(e) => onDrop(e, status, dropTarget?.index ?? idx)}
                        onClick={() => setSelectedIdea(idea)}
                        className={`bg-card border border-black/[0.12] rounded-xl p-3.5 mb-2 shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-150 cursor-grab active:cursor-grabbing group ${draggingId === idea.id ? 'opacity-30 scale-[0.96]' : ''}`}
                      >
                        <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{idea.title}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <IdeaIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                            <span className="text-[11px] text-muted-foreground/50 capitalize truncate">{idea.platform}</span>
                          </div>
                          {idea.priority === 'high' && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">Alta</span>}
                          {idea.priority === 'medium' && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Media</span>}
                        </div>
                        {idea.scheduled_date && <p className="text-[10px] text-muted-foreground/40 mt-1.5">{idea.scheduled_date}</p>}
                      </div>
                      {dropTarget?.status === status && dropTarget.index === idx + 1 && idx === visibleIdeas.length - 1 && draggingId !== idea.id && (
                        <div className="h-1 mx-1 mb-1 rounded-full bg-primary/60" />
                      )}
                    </div>
                  );
                })}

                {columnIdeas.length === 0 && !isDragOver && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[12px] text-muted-foreground/30">Vacío</span>
                  </div>
                )}

                {hiddenCount > 0 && (
                  <span className="text-[11px] text-muted-foreground/40 text-center py-1">+{hiddenCount} más</span>
                )}

                {showQuickAdd && (
                  <button
                    onClick={() => onQuickAdd?.(status)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border/40 text-[12px] text-muted-foreground/40 hover:text-muted-foreground hover:border-border hover:bg-card/50 transition-all duration-200 mt-auto"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Agregar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                    {kanbanStatuses.map(s => {
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

                {selectedIdea.key_message && (
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Mensaje clave</label>
                    <p className="text-[14px] text-foreground/80">{selectedIdea.key_message}</p>
                  </div>
                )}

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

                {/* Feedback — approve/reject to train the AI */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Feedback</label>
                    {selectedIdea.feedback_status === 'approved' && (
                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Aprobado</span>
                    )}
                    {selectedIdea.feedback_status === 'rejected' && (
                      <span className="text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Rechazado</span>
                    )}
                  </div>

                  <Textarea
                    placeholder="¿Por qué aprobás o rechazás esta idea? Este feedback mejora las próximas generaciones..."
                    value={selectedIdea.feedback_notes || ''}
                    onChange={(e) => updateIdea(selectedIdea.id, { feedback_notes: e.target.value })}
                    rows={2}
                    className="mb-2 text-[13px]"
                  />

                  <div className="flex gap-2">
                    <Button
                      variant={selectedIdea.feedback_status === 'approved' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 gap-1.5 ${selectedIdea.feedback_status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                      onClick={() => updateIdea(selectedIdea.id, {
                        feedback_status: selectedIdea.feedback_status === 'approved' ? 'pending' : 'approved',
                        feedback_at: new Date().toISOString(),
                      })}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {selectedIdea.feedback_status === 'approved' ? 'Aprobado' : 'Aprobar'}
                    </Button>
                    <Button
                      variant={selectedIdea.feedback_status === 'rejected' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 gap-1.5 ${selectedIdea.feedback_status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                      onClick={() => updateIdea(selectedIdea.id, {
                        feedback_status: selectedIdea.feedback_status === 'rejected' ? 'pending' : 'rejected',
                        feedback_at: new Date().toISOString(),
                      })}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      {selectedIdea.feedback_status === 'rejected' ? 'Rechazado' : 'Rechazar'}
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics — visible for scheduled & published */}
                {(selectedIdea.status === 'published' || selectedIdea.status === 'scheduled') && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Metricas de rendimiento</label>
                    </div>

                    {selectedIdea.published_url !== undefined && (
                      <div className="mb-3">
                        <Label className="text-[12px] text-muted-foreground">URL publicado</Label>
                        <Input
                          placeholder="https://..."
                          value={selectedIdea.published_url || ''}
                          onChange={(e) => updateIdea(selectedIdea.id, { published_url: e.target.value || null })}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'views', icon: Eye, label: 'Views', placeholder: '0' },
                        { key: 'likes', icon: Heart, label: 'Likes', placeholder: '0' },
                        { key: 'comments', icon: MessageCircle, label: 'Comments', placeholder: '0' },
                        { key: 'shares', icon: Share2, label: 'Shares', placeholder: '0' },
                        { key: 'saves', icon: Bookmark, label: 'Saves', placeholder: '0' },
                      ].map(({ key, icon: Icon, label, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Icon className="h-3 w-3" /> {label}
                          </Label>
                          <Input
                            type="number"
                            placeholder={placeholder}
                            className="h-8 text-[13px]"
                            value={(selectedIdea.performance as any)?.[key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              const perf = { ...(selectedIdea.performance as any || {}), [key]: val };
                              updateIdea(selectedIdea.id, { performance: perf });
                            }}
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Leads</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="h-8 text-[13px]"
                          value={(selectedIdea.performance as any)?.leads ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : undefined;
                            const perf = { ...(selectedIdea.performance as any || {}), leads: val };
                            updateIdea(selectedIdea.id, { performance: perf });
                          }}
                        />
                      </div>
                    </div>

                    {/* Quick performance summary if data exists */}
                    {selectedIdea.performance && Object.values(selectedIdea.performance as any).some((v: any) => v > 0) && (
                      <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {(() => {
                            const p = selectedIdea.performance as any;
                            const engagement = (p.likes || 0) + (p.comments || 0) + (p.shares || 0) + (p.saves || 0);
                            const rate = p.views > 0 ? ((engagement / p.views) * 100).toFixed(1) : '—';
                            return `Engagement rate: ${rate}% · ${engagement.toLocaleString()} interacciones`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border/40">
                  {nextStatus(selectedIdea.status) && (
                    <Button onClick={() => updateStatus(selectedIdea.id, nextStatus(selectedIdea.status)!)} className="flex-1 gap-1.5">
                      Mover a {statusConfig[nextStatus(selectedIdea.status)!]?.label}
                    </Button>
                  )}
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteIdea(selectedIdea.id)}>
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
