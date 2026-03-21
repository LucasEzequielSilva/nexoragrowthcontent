import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function WeeklyBriefs() {
  const { toast } = useToast();
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchBriefs = async () => {
    const { data } = await supabase.from('weekly_briefs').select('*').order('week_start', { ascending: false });
    setBriefs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBriefs(); }, []);

  const promoteIdea = async (suggestion: any) => {
    const { error } = await supabase.from('content_ideas').insert({
      title: suggestion.title,
      description: suggestion.description || '',
      source: 'agent',
      status: 'idea',
      priority: 'medium',
      platform: suggestion.platform || 'multi',
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Idea promoted to pipeline!' });
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly Briefs</h1>
        <Button variant="secondary"><Sparkles className="mr-2 h-4 w-4" /> Generate Brief (Coming Soon)</Button>
      </div>

      {briefs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No weekly briefs yet. Generate your first brief!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {briefs.map(brief => {
            const highlights = (brief.competitor_highlights || []) as any[];
            const topics = (brief.trending_topics || []) as string[];
            const suggestions = (brief.suggested_content || []) as any[];
            return (
              <Card key={brief.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelected(brief)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Week of {format(new Date(brief.week_start), 'MMM d, yyyy')}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>{highlights.length} highlights</span>
                      <span>{topics.length} topics</span>
                      <span>{suggestions.length} suggestions</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Week of {format(new Date(selected.week_start), 'MMMM d, yyyy')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {(selected.trending_topics as string[] || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selected.trending_topics as string[]).map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                )}
                {(selected.suggested_content as any[] || []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Suggested Content</h3>
                    <div className="space-y-2">
                      {(selected.suggested_content as any[]).map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-accent/50 rounded-md">
                          <div>
                            <p className="text-sm font-medium">{s.title}</p>
                            {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => promoteIdea(s)}>
                            <Plus className="mr-1 h-3 w-3" /> Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.notes && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">{selected.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
