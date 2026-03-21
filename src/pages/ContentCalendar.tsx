import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Youtube, Linkedin, Twitter, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns';

const platformIcons: Record<string, any> = { youtube: Youtube, linkedin: Linkedin, twitter: Twitter };
const statusColors: Record<string, string> = {
  idea: 'border-status-idea', researching: 'border-status-researching', drafting: 'border-status-drafting',
  review: 'border-status-review', scheduled: 'border-status-scheduled', published: 'border-status-published',
};

export default function ContentCalendar() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    supabase.from('content_ideas').select('*').not('scheduled_date', 'is', null).then(({ data }) => {
      setIdeas(data || []);
      setLoading(false);
    });
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const ideasByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    ideas.forEach(idea => {
      if (idea.scheduled_date) {
        const key = idea.scheduled_date;
        if (!map[key]) map[key] = [];
        map[key].push(idea);
      }
    });
    return map;
  }, [ideas]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="p-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
            ))}
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayIdeas = ideasByDate[key] || [];
              return (
                <div key={key} className={`min-h-[80px] p-1 border border-border rounded-sm ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''} ${isToday(day) ? 'bg-accent/50' : ''}`}>
                  <div className={`text-xs mb-1 ${isToday(day) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  {dayIdeas.slice(0, 2).map(idea => {
                    const Icon = platformIcons[idea.platform] || FileText;
                    return (
                      <div key={idea.id} className={`text-xs p-1 mb-0.5 rounded border-l-2 ${statusColors[idea.status] || ''} bg-accent/30 truncate flex items-center gap-1`}>
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{idea.title}</span>
                      </div>
                    );
                  })}
                  {dayIdeas.length > 2 && <div className="text-xs text-muted-foreground">+{dayIdeas.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
