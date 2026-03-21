import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Hammer, Wand, BookOpen, User, BarChart, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, any> = { Hammer, Wand, BookOpen, User, BarChart, Globe };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

export default function ContentPillars() {
  const { toast } = useToast();
  const [pillars, setPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editPillar, setEditPillar] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: 'Hammer' });

  const fetchPillars = async () => {
    const { data } = await supabase.from('content_pillars').select('*').order('created_at');
    setPillars(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPillars(); }, []);

  const savePillar = async () => {
    if (editPillar) {
      await supabase.from('content_pillars').update(form).eq('id', editPillar.id);
      toast({ title: 'Pillar updated!' });
    } else {
      await supabase.from('content_pillars').insert(form);
      toast({ title: 'Pillar created!' });
    }
    setShowNew(false);
    setEditPillar(null);
    setForm({ name: '', description: '', color: '#6366f1', icon: 'Hammer' });
    fetchPillars();
  };

  const deletePillar = async (id: string) => {
    await supabase.from('content_pillars').delete().eq('id', id);
    toast({ title: 'Pillar deleted' });
    setEditPillar(null);
    setShowNew(false);
    fetchPillars();
  };

  const openEdit = (pillar: any) => {
    setEditPillar(pillar);
    setForm({ name: pillar.name, description: pillar.description || '', color: pillar.color, icon: pillar.icon });
    setShowNew(true);
  };

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Pillars</h1>
        <Button onClick={() => { setEditPillar(null); setForm({ name: '', description: '', color: '#6366f1', icon: 'Hammer' }); setShowNew(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Pillar
        </Button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map(pillar => {
          const Icon = iconMap[pillar.icon] || Hammer;
          return (
            <motion.div key={pillar.id} variants={item}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => openEdit(pillar)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: pillar.color + '20' }}>
                      <Icon className="h-5 w-5" style={{ color: pillar.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{pillar.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs line-clamp-2">{pillar.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) setEditPillar(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editPillar ? 'Edit Pillar' : 'New Pillar'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
                <div className="flex gap-1 flex-wrap">
                  {Object.keys(iconMap).map(name => {
                    const I = iconMap[name];
                    return (
                      <button key={name} type="button" onClick={() => setForm({ ...form, icon: name })}
                        className={`p-2 rounded-md ${form.icon === name ? 'bg-primary/20 ring-1 ring-primary' : 'bg-accent hover:bg-accent/80'}`}>
                        <I className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePillar} disabled={!form.name} className="flex-1">{editPillar ? 'Update' : 'Create'}</Button>
              {editPillar && <Button variant="destructive" onClick={() => deletePillar(editPillar.id)}>Delete</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
