import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Youtube, Linkedin, Twitter, FileText, Sparkles, Loader2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };
const statusBadgeColors: Record<string, string> = {
  idea: 'bg-status-idea/20 text-status-idea border-status-idea/30',
  researching: 'bg-status-researching/20 text-status-researching border-status-researching/30',
  drafting: 'bg-status-drafting/20 text-status-drafting border-status-drafting/30',
  review: 'bg-status-review/20 text-status-review border-status-review/30',
  scheduled: 'bg-status-scheduled/20 text-status-scheduled border-status-scheduled/30',
  published: 'bg-status-published/20 text-status-published border-status-published/30',
};
const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-status-drafting', low: 'text-muted-foreground' };

export default function ContentIdeas() {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
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

  const fetchIdeas = async () => {
    const { data } = await supabase.from('content_ideas').select('*').order('created_at', { ascending: false });
    setIdeas(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIdeas(); }, []);

  const filtered = ideas.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (platformFilter !== 'all' && i.platform !== platformFilter) return false;
    return true;
  });

  const createIdea = async () => {
    const { error } = await supabase.from('content_ideas').insert({ title: newTitle, description: newDesc, platform: newPlatform, status: newStatus, priority: newPriority, content_type: newType });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Idea creada' });
    setShowNew(false);
    setNewTitle(''); setNewDesc('');
    fetchIdeas();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('content_ideas').update({ status }).eq('id', id);
    toast({ title: `Estado actualizado a ${status}` });
    fetchIdeas();
    if (selectedIdea?.id === id) setSelectedIdea({ ...selectedIdea, status });
  };

  const generateIdea = async () => {
    setGeneratingIdea(true);
    try {
      const result = await api.generateIdea();
      if (result.idea) {
        const { error } = await supabase.from('content_ideas').insert({
          title: result.idea.title,
          description: result.idea.description || '',
          key_message: result.idea.key_message || '',
          content_type: result.idea.content_type || 'hot_take',
          source: 'agent',
          status: 'idea',
          priority: 'medium',
          platform: 'multi',
        });
        if (error) throw error;
        toast({ title: 'Idea generada con AI', description: result.idea.title });
        fetchIdeas();
      }
    } catch (err: any) {
      toast({ title: 'Error al generar idea', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingIdea(false);
    }
  };

  const generateDraft = async (ideaId: string) => {
    setGeneratingDraft(ideaId);
    try {
      const result = await api.generateDraft(ideaId);
      toast({ title: 'Borrador generado', description: 'El borrador fue guardado en la idea' });
      fetchIdeas();
      if (selectedIdea?.id === ideaId) {
        const { data } = await supabase.from('content_ideas').select('*').eq('id', ideaId).single();
        if (data) setSelectedIdea(data);
      }
    } catch (err: any) {
      toast({ title: 'Error al generar borrador', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingDraft(null);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const statuses = ['idea', 'researching', 'drafting', 'review', 'scheduled', 'published'];
  const nextStatus = (s: string) => { const i = statuses.indexOf(s); return i < statuses.length - 1 ? statuses[i + 1] : null; };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Ideas de Contenido</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateIdea} disabled={generatingIdea}>
            {generatingIdea ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generar con AI</>}
          </Button>
          <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Nueva Idea</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ideas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las plataformas</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="twitter">X/Twitter</SelectItem>
            <SelectItem value="multi">Multi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay ideas de contenido. ¡Creá la primera!</CardContent></Card>
        ) : filtered.map(idea => {
          const Icon = platformIcons[idea.platform] || FileText;
          return (
            <Card key={idea.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedIdea(idea)}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{idea.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{idea.content_type} · {idea.platform}</p>
                </div>
                <Badge className={`${statusBadgeColors[idea.status] || ''} capitalize border`}>{idea.status}</Badge>
                <span className={`text-xs font-medium capitalize ${priorityColors[idea.priority] || ''}`}>{idea.priority}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Idea Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Idea de Contenido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder="Descripción" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
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
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
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
                  {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createIdea} disabled={!newTitle} className="w-full">Crear Idea</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedIdea && (
          <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{selectedIdea.title}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${statusBadgeColors[selectedIdea.status]} capitalize border`}>{selectedIdea.status}</Badge>
                  <Badge variant="outline" className="capitalize">{selectedIdea.platform}</Badge>
                  <Badge variant="outline" className="capitalize">{selectedIdea.content_type?.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className={`capitalize ${priorityColors[selectedIdea.priority]}`}>{selectedIdea.priority}</Badge>
                </div>
                {selectedIdea.description && <p className="text-sm text-muted-foreground">{selectedIdea.description}</p>}
                {selectedIdea.target_audience && <div><p className="text-xs text-muted-foreground">Target Audience</p><p className="text-sm">{selectedIdea.target_audience}</p></div>}
                {selectedIdea.scheduled_date && <div><p className="text-xs text-muted-foreground">Programado</p><p className="text-sm">{selectedIdea.scheduled_date}</p></div>}
                {selectedIdea.draft_content && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Borrador</p>
                    <div className="bg-accent/50 rounded-md p-3 text-sm max-h-48 overflow-auto scrollbar-thin whitespace-pre-wrap">{selectedIdea.draft_content}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={generatingDraft === selectedIdea.id}
                    onClick={() => generateDraft(selectedIdea.id)}
                  >
                    {generatingDraft === selectedIdea.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando borrador...</>
                    ) : (
                      <><PenTool className="mr-2 h-4 w-4" /> {selectedIdea.draft_content ? 'Re-generar borrador' : 'Generar borrador'}</>
                    )}
                  </Button>
                  {nextStatus(selectedIdea.status) && (
                    <Button className="flex-1" onClick={() => updateStatus(selectedIdea.id, nextStatus(selectedIdea.status)!)}>
                      Mover a {nextStatus(selectedIdea.status)}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
