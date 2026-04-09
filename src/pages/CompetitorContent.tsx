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
import { Plus, Search, Youtube, Linkedin, Twitter, FileText, Eye, ThumbsUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };

export default function CompetitorContentLog() {
  const { toast } = useToast();
  const [content, setContent] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [compFilter, setCompFilter] = useState('all');
  const [platFilter, setPlatFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ competitor_id: '', platform: 'youtube', title: '', url: '', content_body: '' });

  const fetchData = async () => {
    const [contentRes, compRes] = await Promise.all([
      supabase.from('competitor_content').select('*, competitors(name, avatar_url)').order('created_at', { ascending: false }),
      supabase.from('competitors').select('id, name'),
    ]);
    setContent(contentRes.data || []);
    setCompetitors(compRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = content.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (compFilter !== 'all' && c.competitor_id !== compFilter) return false;
    if (platFilter !== 'all' && c.platform !== platFilter) return false;
    return true;
  });

  const createContent = async () => {
    const { error } = await supabase.from('competitor_content').insert(form);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Contenido registrado' });
    setShowNew(false);
    setForm({ competitor_id: '', platform: 'youtube', title: '', url: '', content_body: '' });
    fetchData();
  };

  const analyzeContent = async (contentId: string) => {
    setAnalyzing(contentId);
    try {
      const result = await api.analyzeContent(contentId);
      toast({ title: 'Contenido analizado', description: result.summary?.slice(0, 100) });
      fetchData();
      // Update selected if open
      if (selected?.id === contentId) {
        const { data } = await supabase.from('competitor_content').select('*, competitors(name, avatar_url)').eq('id', contentId).single();
        if (data) setSelected(data);
      }
    } catch (err: any) {
      toast({ title: 'Error al analizar', description: err.message, variant: 'destructive' });
    } finally {
      setAnalyzing(null);
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Contenido de Competidores</h1>
        <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Registrar Contenido</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar contenido..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={compFilter} onValueChange={setCompFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Competidor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {competitors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platFilter} onValueChange={setPlatFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="twitter">X/Twitter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No hay contenido registrado todavia.</CardContent></Card>
        ) : filtered.map(c => {
          const Icon = platformIcons[c.platform] || FileText;
          const metrics = (c.engagement_metrics || {}) as Record<string, number>;
          return (
            <Card key={c.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelected(c)}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{(c as any).competitors?.name} · {c.published_at ? new Date(c.published_at).toLocaleDateString() : 'Sin fecha'}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {metrics.views && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{metrics.views}</span>}
                  {metrics.likes && <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{metrics.likes}</span>}
                </div>
                {c.is_analyzed && <Badge variant="outline" className="text-xs text-status-published border-status-published/30">Analizado</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalle */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">{selected.platform}</Badge>
                  <Badge variant="outline">{(selected as any).competitors?.name}</Badge>
                </div>
                {selected.url && <a href={selected.url} target="_blank" rel="noopener" className="text-sm text-primary hover:underline block truncate">{selected.url}</a>}
                {selected.content_body && <div className="bg-accent/50 rounded-md p-3 text-sm max-h-48 overflow-auto scrollbar-thin">{selected.content_body}</div>}
                {selected.analysis_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Analisis</p>
                    <p className="text-sm whitespace-pre-wrap">{selected.analysis_notes}</p>
                  </div>
                )}
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                <Button
                  variant={selected.is_analyzed ? "outline" : "default"}
                  className="w-full"
                  disabled={analyzing === selected.id}
                  onClick={(e) => { e.stopPropagation(); analyzeContent(selected.id); }}
                >
                  {analyzing === selected.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...</>
                  ) : selected.is_analyzed ? 'Re-analizar con AI' : 'Analizar con AI'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Nuevo Contenido */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Contenido de Competidor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.competitor_id} onValueChange={(v) => setForm({ ...form, competitor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar Competidor" /></SelectTrigger>
              <SelectContent>
                {competitors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">X/Twitter</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            <Textarea placeholder="Contenido / Transcripcion" value={form.content_body} onChange={(e) => setForm({ ...form, content_body: e.target.value })} />
            <Button onClick={createContent} disabled={!form.competitor_id || !form.title} className="w-full">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
