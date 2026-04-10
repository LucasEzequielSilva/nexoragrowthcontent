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
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KanbanBoard, statusConfig } from '@/components/KanbanBoard';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const platformIcons: Record<string, HeroIcon> = {
  youtube: PlayIcon, linkedin: ShareIcon, twitter: PaperAirplaneIcon,
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

  const thisWeek = ideas.filter(i => i.scheduled_date && i.status !== 'published');

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-[1100px]">
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

      {/* KPI Cards */}
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

      {/* Pipeline — Kanban (shared component) */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Pipeline de Contenido</h2>
          <Link to="/ideas">
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground">Ver todo</Button>
          </Link>
        </div>
        <KanbanBoard ideas={ideas} setIdeas={setIdeas} columnWidth={185} maxCards={4} />
      </motion.div>

      {/* Two Column: Schedule + Competitor Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Agregá ideas al calendario</p>
                  <Link to="/ideas"><Button variant="outline" size="sm">Programar contenido</Button></Link>
                </div>
              ) : (
                <div className="space-y-1">
                  {thisWeek.map(idea => {
                    const Icon = platformIcons[idea.platform] || DocumentTextIcon;
                    const cfg = statusConfig[idea.status] || statusConfig.idea;
                    return (
                      <div key={idea.id} className="flex items-center gap-3.5 p-3 -mx-1 rounded-xl hover:bg-accent/50 transition-colors duration-150 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium truncate">{idea.title}</p>
                          <p className="text-[12px] text-muted-foreground">{idea.scheduled_date}</p>
                        </div>
                        <Badge variant={cfg.badge} className="shrink-0">{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                  <p className="text-[13px] text-muted-foreground/60 mb-4">Registrá contenido de competidores</p>
                  <Link to="/competitors/content"><Button variant="outline" size="sm">Registrar contenido</Button></Link>
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
                        {c.is_analyzed && <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />}
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
