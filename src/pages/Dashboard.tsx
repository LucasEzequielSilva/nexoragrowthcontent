import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LightBulbIcon, CalendarIcon, UserGroupIcon, CpuChipIcon,
  CalendarDaysIcon, EyeIcon, DocumentTextIcon, RocketLaunchIcon,
  PaperAirplaneIcon, ShareIcon, PlayIcon, PlusIcon,
  CheckCircleIcon, ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  youtube: PlayIcon,
  linkedin: ShareIcon,
  twitter: PaperAirplaneIcon,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } } };

export default function Dashboard() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [competitorContent, setCompetitorContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const statusCounts = ideas.reduce((acc: Record<string, number>, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const thisWeek = ideas.filter(i => i.scheduled_date && i.status !== 'published');
  const statuses = Object.keys(statusConfig);

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1100px] ">
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

      {/* KPI Cards — icon circles like Daybridge */}
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

      {/* Pipeline — Step cards */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-[15px] font-semibold">Pipeline de Contenido</CardTitle>
            <Link to="/ideas">
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground">Ver todo</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {statuses.map((status, i) => {
                const cfg = statusConfig[status];
                const count = statusCounts[status] || 0;
                return (
                  <div key={status} className="flex items-center gap-2.5">
                    <div className={`flex flex-col items-center justify-center min-w-[110px] px-5 py-4 rounded-2xl transition-all duration-200 ${count > 0 ? `${cfg.bg} border border-transparent` : 'bg-muted/40 border border-dashed border-border'}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className={`text-[12px] font-medium ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <p className="text-2xl font-bold tabular-nums">{count}</p>
                    </div>
                    {i < statuses.length - 1 && (
                      <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* This Week */}
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
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Agregá ideas al calendario para esta semana</p>
                  <Link to="/ideas">
                    <Button variant="outline" size="sm">Programar contenido</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {thisWeek.map(idea => {
                    const Icon = platformIcons[idea.platform] || DocumentTextIcon;
                    const cfg = statusConfig[idea.status] || statusConfig.idea;
                    return (
                      <div key={idea.id} className="flex items-center gap-3.5 p-3 -mx-1 rounded-xl hover:bg-accent/50 transition-colors duration-150">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium truncate">{idea.title}</p>
                          <p className="text-[12px] text-muted-foreground">{idea.scheduled_date}</p>
                        </div>
                        <Badge variant={cfg.badge} className="shrink-0">
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Competitor Pulse */}
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
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Registrá contenido de competidores para trackear</p>
                  <Link to="/competitors/content">
                    <Button variant="outline" size="sm">Registrar contenido</Button>
                  </Link>
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
                        {c.is_analyzed && (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                        )}
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
  );
}
