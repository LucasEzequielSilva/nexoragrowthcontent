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
import {
  UserGroupIcon, MagnifyingGlassIcon, PlusIcon,
} from '@heroicons/react/24/solid';
import { PlayIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const tierConfig: Record<string, { label: string; class: string }> = {
  tier_1: { label: 'Tier 1', class: 'bg-primary/10 text-primary' },
  tier_2: { label: 'Tier 2', class: 'bg-amber-50 text-amber-600' },
  tier_3: { label: 'Tier 3', class: 'bg-muted text-muted-foreground' },
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
  return String(n);
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] } } };

const EMPTY_FORM = {
  name: '', agency_name: '', content_style: '', what_they_sell: '', frequency: '', notes: '', tier: 'tier_1',
  youtube_url: '', instagram_url: '', twitter_url: '', linkedin_url: '', tiktok_url: '',
};

export default function Competitors() {
  const { toast } = useToast();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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
    // Build platforms JSON from URL fields
    const platforms: Record<string, string> = {};
    if (form.youtube_url) platforms.youtube = form.youtube_url;
    if (form.instagram_url) platforms.instagram = form.instagram_url;
    if (form.twitter_url) platforms.twitter = form.twitter_url;
    if (form.linkedin_url) platforms.linkedin = form.linkedin_url;
    if (form.tiktok_url) platforms.tiktok = form.tiktok_url;

    const { error } = await supabase.from('competitors').insert({
      name: form.name,
      agency_name: form.agency_name || null,
      content_style: form.content_style || null,
      what_they_sell: form.what_they_sell || null,
      frequency: form.frequency || null,
      notes: form.notes || null,
      tier: form.tier,
      platforms,
    });

    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Competidor agregado' });
    setShowNew(false);
    setForm(EMPTY_FORM);
    fetchCompetitors();
  };

  const platformCount = (platforms: Record<string, string>) => Object.keys(platforms || {}).length;

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1100px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Competidores</h1>
          <p className="text-muted-foreground text-[14px] mt-0.5">{competitors.length} competidores trackeados</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm" className="gap-1.5">
          <PlusIcon className="h-4 w-4" /> Agregar Competidor
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input placeholder="Buscar competidores..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tiers</SelectItem>
            <SelectItem value="tier_1">Tier 1</SelectItem>
            <SelectItem value="tier_2">Tier 2</SelectItem>
            <SelectItem value="tier_3">Tier 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-[14px] font-medium text-muted-foreground mb-1">No hay competidores</p>
          <p className="text-[13px] text-muted-foreground/60 mb-4">Agregá competidores para empezar a trackear su contenido</p>
          <Button onClick={() => setShowNew(true)} size="sm">Agregar Competidor</Button>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(comp => {
            const platforms = (comp.platforms || {}) as Record<string, string>;
            const audience = (comp.audience_size || {}) as Record<string, number>;
            const pCount = platformCount(platforms);
            return (
              <motion.div key={comp.id} variants={item}>
                <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelected(comp)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                        <UserGroupIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-[15px]">{comp.name}</CardTitle>
                          {comp.tier && tierConfig[comp.tier] && (
                            <Badge variant="outline" className={`${tierConfig[comp.tier].class} text-[10px] px-1.5 py-0 border-0`}>
                              {tierConfig[comp.tier].label}
                            </Badge>
                          )}
                        </div>
                        {comp.agency_name && <CardDescription className="text-[12px] mt-0.5">{comp.agency_name}</CardDescription>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Platform pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(platforms).map(([platform, handle]) => {
                        const count = audience[platform];
                        return (
                          <div key={platform} className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1">
                            <span className="capitalize font-medium">{platform}</span>
                            {count ? <span className="text-foreground font-semibold">{formatCount(count)}</span> : null}
                          </div>
                        );
                      })}
                      {pCount === 0 && <span className="text-[12px] text-muted-foreground/50">Sin perfiles cargados</span>}
                    </div>
                    {comp.content_style && <p className="text-[12px] text-muted-foreground line-clamp-2">{comp.content_style}</p>}
                    {comp.frequency && (
                      <Badge variant="outline" className="text-[11px]">{comp.frequency}</Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{selected.name}</span>
                      {selected.tier && tierConfig[selected.tier] && (
                        <Badge variant="outline" className={`${tierConfig[selected.tier].class} text-[10px] px-1.5 py-0 border-0`}>
                          {tierConfig[selected.tier].label}
                        </Badge>
                      )}
                    </div>
                    {selected.agency_name && <p className="text-[13px] font-normal text-muted-foreground">{selected.agency_name}</p>}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Platform links */}
                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Perfiles</p>
                  <div className="space-y-1.5">
                    {Object.entries((selected.platforms || {}) as Record<string, string>).map(([platform, url]) => {
                      const count = ((selected.audience_size || {}) as Record<string, number>)[platform];
                      const isUrl = (url as string).startsWith('http');
                      return (
                        <div key={platform} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                          <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center border border-black/[0.04]">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">{(platform as string).slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium capitalize">{platform}</p>
                            {isUrl ? (
                              <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary hover:underline truncate block">{url as string}</a>
                            ) : (
                              <p className="text-[12px] text-muted-foreground truncate">{url as string}</p>
                            )}
                          </div>
                          {count && <Badge variant="secondary" className="text-[11px]">{formatCount(count)}</Badge>}
                        </div>
                      );
                    })}
                    {Object.keys(selected.platforms || {}).length === 0 && (
                      <p className="text-[13px] text-muted-foreground/50 py-2">Sin perfiles cargados</p>
                    )}
                  </div>
                </div>

                {selected.content_style && (
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Estilo de contenido</p>
                    <p className="text-[14px]">{selected.content_style}</p>
                  </div>
                )}
                {selected.what_they_sell && (
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Qué venden</p>
                    <p className="text-[14px]">{selected.what_they_sell}</p>
                  </div>
                )}
                {selected.frequency && (
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Frecuencia</p>
                    <p className="text-[14px]">{selected.frequency}</p>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
                    <p className="text-[14px] text-muted-foreground">{selected.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Competitor Dialog — with profile URL inputs */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Competidor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Agencia / Proyecto" value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} />
            </div>

            {/* Profile URLs — ready for scraping */}
            <div>
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Perfiles para scraping</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <PlayIcon className="h-4 w-4 text-red-500" />
                  </div>
                  <Input placeholder="YouTube — URL del canal o @handle" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <Input placeholder="Instagram — URL del perfil" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <Input placeholder="X (Twitter) — URL del perfil" value={form.twitter_url} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <Input placeholder="LinkedIn — URL del perfil" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <svg className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </div>
                  <Input placeholder="TikTok — URL del perfil" value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <Input placeholder="Estilo de contenido" value={form.content_style} onChange={(e) => setForm({ ...form, content_style: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Qué venden" value={form.what_they_sell} onChange={(e) => setForm({ ...form, what_they_sell: e.target.value })} />
                <Input placeholder="Frecuencia (ej: 2 videos/week)" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
              </div>
              <Textarea placeholder="Notas internas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier_1">Tier 1 — Competidor directo</SelectItem>
                  <SelectItem value="tier_2">Tier 2 — Referencia de formato</SelectItem>
                  <SelectItem value="tier_3">Tier 3 — Referencia tangencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={createCompetitor} disabled={!form.name} className="w-full">
              Agregar Competidor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
