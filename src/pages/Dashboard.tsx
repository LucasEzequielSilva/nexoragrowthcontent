import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Calendar, Users, Bot, Plus, FileText, Sparkles, Youtube, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  idea: 'bg-status-idea',
  researching: 'bg-status-researching',
  drafting: 'bg-status-drafting',
  review: 'bg-status-review',
  scheduled: 'bg-status-scheduled',
  published: 'bg-status-published',
};

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [competitorContent, setCompetitorContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('content_ideas').select('*').order('created_at', { ascending: false }),
      supabase.from('competitors').select('*').eq('is_active', true),
      supabase.from('competitor_content').select('*, competitors(name, avatar_url)').order('created_at', { ascending: false }).limit(5),
    ]).then(([ideasRes, compRes, contentRes]) => {
      setIdeas(ideasRes.data || []);
      setCompetitors(compRes.data || []);
      setCompetitorContent(contentRes.data || []);
      setLoading(false);
    });
  }, []);

  const statusCounts = ideas.reduce((acc: Record<string, number>, idea) => {
    acc[idea.status] = (acc[idea.status] || 0) + 1;
    return acc;
  }, {});

  const thisWeek = ideas.filter(i => i.scheduled_date && i.status !== 'published');
  const statuses = ['idea', 'researching', 'drafting', 'review', 'scheduled', 'published'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your content operations at a glance</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ideas in Pipeline', value: ideas.length, icon: LayoutDashboard, color: 'text-primary' },
          { label: 'Scheduled This Week', value: thisWeek.length, icon: Calendar, color: 'text-status-scheduled' },
          { label: 'Competitors Tracked', value: competitors.length, icon: Users, color: 'text-status-researching' },
          { label: 'Agent Suggestions', value: 0, icon: Bot, color: 'text-status-drafting' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Pipeline */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Content Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {statuses.map((status, i) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <div className={`w-10 h-10 rounded-full ${statusColors[status]} flex items-center justify-center text-sm font-bold text-background`}>
                      {statusCounts[status] || 0}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 capitalize">{status}</span>
                  </div>
                  {i < statuses.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Week */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">This Week's Plan</CardTitle>
              <Link to="/calendar"><Button variant="ghost" size="sm">View Calendar</Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {thisWeek.length === 0 ? (
                <p className="text-sm text-muted-foreground">No content scheduled this week</p>
              ) : thisWeek.map(idea => {
                const Icon = platformIcons[idea.platform] || FileText;
                return (
                  <div key={idea.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{idea.title}</p>
                      <p className="text-xs text-muted-foreground">{idea.scheduled_date}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{idea.status}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Competitor Pulse */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Competitor Pulse</CardTitle>
              <Link to="/competitors/content"><Button variant="ghost" size="sm">View All</Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitorContent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No competitor content logged yet</p>
              ) : competitorContent.map(c => {
                const Icon = platformIcons[c.platform] || FileText;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{(c as any).competitors?.name}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Link to="/ideas"><Button><Plus className="mr-2 h-4 w-4" /> New Idea</Button></Link>
        <Link to="/competitors/content"><Button variant="secondary"><FileText className="mr-2 h-4 w-4" /> Log Competitor Content</Button></Link>
        <Link to="/briefs"><Button variant="secondary"><Sparkles className="mr-2 h-4 w-4" /> Generate Brief</Button></Link>
      </motion.div>
    </motion.div>
  );
}
