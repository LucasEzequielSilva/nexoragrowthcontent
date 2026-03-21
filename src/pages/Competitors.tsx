import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Youtube, Linkedin, Twitter, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };

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
  const [selected, setSelected] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', agency_name: '', content_style: '', what_they_sell: '', frequency: '', notes: '' });

  const fetchCompetitors = async () => {
    const { data } = await supabase.from('competitors').select('*').order('created_at', { ascending: false });
    setCompetitors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompetitors(); }, []);

  const filtered = competitors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.agency_name?.toLowerCase().includes(search.toLowerCase())
  );

  const createCompetitor = async () => {
    const { error } = await supabase.from('competitors').insert(form);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Competitor added!' });
    setShowNew(false);
    setForm({ name: '', agency_name: '', content_style: '', what_they_sell: '', frequency: '', notes: '' });
    fetchCompetitors();
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Competitors</h1>
        <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Add Competitor</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search competitors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <div>
                      <CardTitle className="text-base">{comp.name}</CardTitle>
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
                    <span>{selected.name}</span>
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
                {selected.content_style && <div><p className="text-xs text-muted-foreground mb-1">Content Style</p><p className="text-sm">{selected.content_style}</p></div>}
                {selected.what_they_sell && <div><p className="text-xs text-muted-foreground mb-1">What They Sell</p><p className="text-sm">{selected.what_they_sell}</p></div>}
                {selected.frequency && <div><p className="text-xs text-muted-foreground mb-1">Frequency</p><p className="text-sm">{selected.frequency}</p></div>}
                {selected.notes && <div><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{selected.notes}</p></div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Competitor Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Agency Name" value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} />
            <Input placeholder="Content Style" value={form.content_style} onChange={(e) => setForm({ ...form, content_style: e.target.value })} />
            <Input placeholder="What They Sell" value={form.what_they_sell} onChange={(e) => setForm({ ...form, what_they_sell: e.target.value })} />
            <Input placeholder="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button onClick={createCompetitor} disabled={!form.name} className="w-full">Add Competitor</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
