import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon, MagnifyingGlassIcon, SparklesIcon,
  PlayIcon, ShareIcon, PaperAirplaneIcon, DocumentTextIcon,
  ViewColumnsIcon, ListBulletIcon,
} from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { KanbanBoard, kanbanStatuses, statusConfig } from '@/components/KanbanBoard';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;
const platformIcons: Record<string, HeroIcon> = { youtube: PlayIcon, linkedin: ShareIcon, twitter: PaperAirplaneIcon };
const priorityLabels: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

export default function ContentIdeas() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPlatform, setNewPlatform] = useState('multi');
  const [newStatus, setNewStatus] = useState('idea');
  const [newPriority, setNewPriority] = useState('medium');
  const [newType, setNewType] = useState('tutorial');
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genCount, setGenCount] = useState(5);
  const [genPlatform, setGenPlatform] = useState('multi');
  const [genProgress, setGenProgress] = useState(0);

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

  const generateIdeas = async () => {
    setGeneratingIdea(true);
    setGenProgress(0);
    setShowGenerate(false);
    let generated = 0;

    for (let i = 0; i < genCount; i++) {
      try {
        setGenProgress(i + 1);
        const result = await api.generateIdea(undefined, genPlatform !== 'multi' ? genPlatform : undefined);
        if (result.idea) {
          await supabase.from('content_ideas').insert({
            title: result.idea.title, description: result.idea.description || '',
            key_message: result.idea.key_message || '', content_type: result.idea.content_type || 'hot_take',
            source: 'agent', status: 'idea', priority: 'medium', platform: genPlatform,
          });
          generated++;
        }
      } catch (err: any) {
        toast({ title: `Error en idea ${i + 1}`, description: err.message, variant: 'destructive' });
      }
    }

    toast({ title: `${generated} ideas generadas`, description: 'Revisalas y aprobá o rechazá para mejorar las próximas.' });
    fetchIdeas();
    setGeneratingIdea(false);
    setGenProgress(0);
  };

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
          <Button variant="outline" onClick={() => setShowGenerate(true)} disabled={generatingIdea} size="sm" className="gap-1.5">
            {generatingIdea ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando {genProgress}/{genCount}...</> : <><SparklesIcon className="h-4 w-4" /> Generar con AI</>}
          </Button>
          <Button onClick={() => { setNewStatus('idea'); setShowNew(true); }} size="sm" className="gap-1.5">
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

      {/* ===== KANBAN VIEW (shared component) ===== */}
      {view === 'kanban' && (
        <KanbanBoard
          ideas={filtered}
          setIdeas={setIdeas}
          columnWidth={220}
          showQuickAdd
          onQuickAdd={(status) => { setNewStatus(status); setShowNew(true); }}
        />
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
                className="flex items-center gap-3.5 p-3.5 bg-card border border-black/[0.12] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate group-hover:text-primary transition-colors">{idea.title}</p>
                  <p className="text-[12px] text-muted-foreground/50 capitalize">{idea.content_type?.replace(/_/g, ' ')} · {idea.platform}</p>
                </div>
                <Badge variant={cfg.badge} className="shrink-0">{cfg.label}</Badge>
                <span className={`text-[12px] font-medium ${idea.priority === 'high' ? 'text-red-500' : idea.priority === 'medium' ? 'text-amber-600' : 'text-muted-foreground'}`}>
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
                  {kanbanStatuses.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createIdea} disabled={!newTitle} className="w-full">Crear Idea</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== GENERATE IDEAS DIALOG ===== */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Generar ideas con AI</DialogTitle></DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Generá varias ideas de una para compararlas. Después aprobá o rechazá cada una — eso mejora las próximas generaciones.
          </p>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Cantidad de ideas</label>
              <div className="flex gap-2">
                {[3, 5, 10, 15].map(n => (
                  <button
                    key={n}
                    onClick={() => setGenCount(n)}
                    className={`flex-1 py-2 rounded-lg text-[14px] font-semibold transition-all ${genCount === n ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Plataforma</label>
              <Select value={genPlatform} onValueChange={setGenPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="multi">Todas</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">X/Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateIdeas} className="w-full gap-1.5">
              <SparklesIcon className="h-4 w-4" /> Generar {genCount} ideas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
