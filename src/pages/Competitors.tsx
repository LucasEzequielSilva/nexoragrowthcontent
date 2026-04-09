import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Youtube, Linkedin, Twitter, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };
const tierConfig: Record<string, { label: string; class: string }> = {
  tier_1: { label: 'Tier 1', class: 'bg-primary/20 text-primary border-primary/30' },
  tier_2: { label: 'Tier 2', class: 'bg-status-drafting/20 text-status-drafting border-status-drafting/30' },
  tier_3: { label: 'Tier 3', class: 'bg-muted text-muted-foreground border-muted-foreground/30' },
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(n);
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Competitors() {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', agency_name: '', content_style: '', what_they_sell: '', frequency: '', notes: '', tier: 'tier_1' });

  const fetchCompetitors = async () => {
    const { data } = await supabase.from('competitors').select('*').order('created_at', { ascending: false });
    setCompetitors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompetitors(); }, []);

  const filtered = competitors.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.agency_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
    return true;
  });

  const createCompetitor = async () => {
    const { error } = await supabase.from('competitors').insert(form);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Competitor added!' });
    setShowNew(false);
    setForm({ name: '', agency_name: '', content_style: '', what_they_sell: '', frequency: '', notes: '', tier: 'tier_1' });
    fetchCompetitors();
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Competidores</h1>
        <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Agregar Competidor</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar competidores..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="tier_1">Tier 1</SelectItem>
            <SelectItem value="tier_2">Tier 2</SelectItem>
            <SelectItem value="tier_3">Tier 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(comp => {
          const audience = (comp.audience_size || {}) as Record<string, number>;
          const platforms = (comp.platforms || {}) as Record<string, string>;
          return (
            <motion.div key={comp.id} variants={item}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelected(comp)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{comp.name}</CardTitle>
                        {comp.tier && tierConfig[comp.tier] && (
                          <Badge className={`${tierConfig[comp.tier].class} border text-[10px] px-1.5 py-0`}>{tierConfig[comp.tier].label}</Badge>
                        )}
                      </div>
                      {comp.agency_name && <CardDescription className="text-xs">{comp.agency_name}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(platforms).map(([platform, handle]) => {
                      const Icon = platformIcons[platform] || Users;
                      const count = audience[platform];
                      return (
                        <div key={platform} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          {count && <span className="font-medium text-foreground">{formatCount(count)}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {comp.content_style && <p className="text-xs text-muted-foreground line-clamp-2">{comp.content_style}</p>}
                  <div className="flex items-center justify-between">
                    {comp.frequency && <Badge variant="outline" className="text-xs">{comp.frequency}</Badge>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selected.name}</span>
                      {selected.tier && tierConfig[selected.tier] && (
                        <Badge className={`${tierConfig[selected.tier].class} border text-[10px] px-1.5 py-0`}>{tierConfig[selected.tier].label}</Badge>
                      )}
                    </div>
                    {selected.agency_name && <p className="text-sm font-normal text-muted-foreground">{selected.agency_name}</p>}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {Object.entries((selected.platforms || {}) as Record<string, string>).map(([p, handle]) => {
                    const Icon = platformIcons[p] || Users;
                    const count = ((selected.audience_size || {}) as Record<string, number>)[p];
                    return (
                      <div key={p} className="flex items-center gap-2 bg-accent rounded-md px-3 py-1.5">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{handle as string}</span>
                        {count && <Badge variant="secondary" className="text-xs">{formatCount(count)}</Badge>}
                      </div>
                    );
                  })}
                </div>
                {selected.content_style && <div><p className="text-xs text-muted-foreground mb-1">Estilo de contenido</p><p className="text-sm">{selected.content_style}</p></div>}
                {selected.what_they_sell && <div><p className="text-xs text-muted-foreground mb-1">Qué venden</p><p className="text-sm">{selected.what_they_sell}</p></div>}
                {selected.frequency && <div><p className="text-xs text-muted-foreground mb-1">Frecuencia</p><p className="text-sm">{selected.frequency}</p></div>}
                {selected.notes && <div><p className="text-xs text-muted-foreground mb-1">Notas</p><p className="text-sm">{selected.notes}</p></div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Competitor Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar Competidor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Agencia / Proyecto" value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} />
            <Input placeholder="Estilo de contenido" value={form.content_style} onChange={(e) => setForm({ ...form, content_style: e.target.value })} />
            <Input placeholder="Qué venden" value={form.what_they_sell} onChange={(e) => setForm({ ...form, what_they_sell: e.target.value })} />
            <Input placeholder="Frecuencia" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            <Textarea placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
              <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tier_1">Tier 1 — Competidor directo</SelectItem>
                <SelectItem value="tier_2">Tier 2 — Referencia de formato</SelectItem>
                <SelectItem value="tier_3">Tier 3 — Referencia tangencial</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createCompetitor} disabled={!form.name} className="w-full">Agregar Competidor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
