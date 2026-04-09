import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, ChevronLeft, ChevronRight, Trash2, GripVertical, Image, Sparkles, Loader2,
  LayoutGrid, ArrowLeft, Copy, MoveUp, MoveDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Slide {
  id?: string;
  carousel_id?: string;
  slide_order: number;
  slide_type: 'cover' | 'content' | 'cta';
  title: string;
  copy: string;
  description: string;
  cover_url: string;
  bg_color: string;
  text_color: string;
}

const defaultSlide = (order: number, type: 'cover' | 'content' | 'cta' = 'content'): Slide => ({
  slide_order: order,
  slide_type: type,
  title: '',
  copy: '',
  description: '',
  cover_url: '',
  bg_color: '#1a1a2e',
  text_color: '#ffffff',
});

const SLIDE_TYPE_LABELS: Record<string, string> = {
  cover: 'Cover',
  content: 'Contenido',
  cta: 'CTA',
};

export default function Carousels() {
  const { toast } = useToast();
  const [carousels, setCarousels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');

  // Editor state
  const [editing, setEditing] = useState<any | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const fetchCarousels = async () => {
    const { data } = await supabase.from('carousels').select('*').order('created_at', { ascending: false });
    setCarousels(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCarousels(); }, []);

  const createCarousel = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase.from('carousels').insert({
      title: newTitle,
      platform: newPlatform,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Create default slides: cover + 5 content + cta
    const defaultSlides = [
      defaultSlide(0, 'cover'),
      defaultSlide(1, 'content'),
      defaultSlide(2, 'content'),
      defaultSlide(3, 'content'),
      defaultSlide(4, 'content'),
      defaultSlide(5, 'content'),
      defaultSlide(6, 'cta'),
    ].map(s => ({ ...s, carousel_id: data.id }));

    await supabase.from('carousel_slides').insert(defaultSlides);
    toast({ title: 'Carrusel creado' });
    setShowNew(false);
    setNewTitle('');
    fetchCarousels();
    openEditor(data);
  };

  const openEditor = async (carousel: any) => {
    const { data } = await supabase
      .from('carousel_slides')
      .select('*')
      .eq('carousel_id', carousel.id)
      .order('slide_order', { ascending: true });
    setSlides(data || []);
    setEditing(carousel);
    setActiveSlide(0);
  };

  const updateSlide = (index: number, field: keyof Slide, value: string) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSlide = () => {
    const newOrder = slides.length > 0 ? Math.max(...slides.map(s => s.slide_order)) + 1 : 0;
    // Insert before CTA if last slide is CTA
    const lastIsCta = slides.length > 0 && slides[slides.length - 1].slide_type === 'cta';
    if (lastIsCta) {
      const updated = [...slides];
      const ctaSlide = updated.pop()!;
      updated.push(defaultSlide(updated.length, 'content'));
      ctaSlide.slide_order = updated.length;
      updated.push(ctaSlide);
      setSlides(updated.map((s, i) => ({ ...s, slide_order: i })));
      setActiveSlide(updated.length - 2);
    } else {
      setSlides([...slides, defaultSlide(newOrder, 'content')]);
      setActiveSlide(slides.length);
    }
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 2) return;
    const updated = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, slide_order: i }));
    setSlides(updated);
    setActiveSlide(Math.min(activeSlide, updated.length - 1));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSlides(updated.map((s, i) => ({ ...s, slide_order: i })));
    setActiveSlide(newIndex);
  };

  const saveSlides = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // Delete existing slides and re-insert
      await supabase.from('carousel_slides').delete().eq('carousel_id', editing.id);
      const toInsert = slides.map((s, i) => ({
        carousel_id: editing.id,
        slide_order: i,
        slide_type: s.slide_type,
        title: s.title,
        copy: s.copy,
        description: s.description,
        cover_url: s.cover_url,
        bg_color: s.bg_color,
        text_color: s.text_color,
      }));
      const { error } = await supabase.from('carousel_slides').insert(toInsert);
      if (error) throw error;
      toast({ title: 'Carrusel guardado' });
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const generateWithAI = async () => {
    if (!editing) return;
    setGeneratingAI(true);
    try {
      const result = await api.generateCarousel(editing.title, slides.length);
      if (result.slides && Array.isArray(result.slides)) {
        setSlides(prev => prev.map((s, i) => {
          const aiSlide = result.slides[i];
          if (!aiSlide) return s;
          return {
            ...s,
            title: aiSlide.title || s.title,
            copy: aiSlide.copy || s.copy,
            description: aiSlide.description || s.description,
          };
        }));
        toast({ title: 'Copy generado con AI', description: 'Revisa cada slide y ajusta' });
      }
    } catch (err: any) {
      toast({ title: 'Error al generar', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const deleteCarousel = async (id: string) => {
    await supabase.from('carousels').delete().eq('id', id);
    toast({ title: 'Carrusel eliminado' });
    fetchCarousels();
  };

  const duplicateSlide = (index: number) => {
    const clone = { ...slides[index], id: undefined, slide_order: index + 1 };
    const updated = [...slides];
    updated.splice(index + 1, 0, clone);
    setSlides(updated.map((s, i) => ({ ...s, slide_order: i })));
    setActiveSlide(index + 1);
  };

  // --- EDITOR VIEW ---
  if (editing) {
    const slide = slides[activeSlide];
    if (!slide) return null;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setEditing(null); fetchCarousels(); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{editing.title}</h1>
              <p className="text-xs text-muted-foreground">{slides.length} slides · {editing.platform}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={generateWithAI} disabled={generatingAI}>
              {generatingAI ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generar Copy AI</>}
            </Button>
            <Button size="sm" onClick={saveSlides} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {/* Left: Slide Editor */}
          <div className="space-y-4">
            {/* Preview Card */}
            <Card className="overflow-hidden">
              <div
                className="aspect-square max-w-md mx-auto flex flex-col items-center justify-center p-8 text-center relative"
                style={{ backgroundColor: slide.bg_color, color: slide.text_color }}
              >
                {slide.cover_url && (
                  <img src={slide.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="relative z-10 space-y-3">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {SLIDE_TYPE_LABELS[slide.slide_type]} · {activeSlide + 1}/{slides.length}
                  </Badge>
                  {slide.title && <h2 className="text-2xl font-bold leading-tight">{slide.title}</h2>}
                  {slide.copy && <p className="text-sm opacity-90 leading-relaxed">{slide.copy}</p>}
                  {slide.description && <p className="text-xs opacity-70 mt-2">{slide.description}</p>}
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" disabled={activeSlide === 0} onClick={() => setActiveSlide(activeSlide - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Slide {activeSlide + 1} de {slides.length}
              </span>
              <Button variant="outline" size="icon" disabled={activeSlide === slides.length - 1} onClick={() => setActiveSlide(activeSlide + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Slide Form */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Select value={slide.slide_type} onValueChange={(v) => updateSlide(activeSlide, 'slide_type', v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="cta">CTA</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(activeSlide, -1)} disabled={activeSlide === 0}>
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(activeSlide, 1)} disabled={activeSlide === slides.length - 1}>
                      <MoveDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateSlide(activeSlide)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSlide(activeSlide)} disabled={slides.length <= 2}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Titulo</label>
                  <Input
                    value={slide.title}
                    onChange={(e) => updateSlide(activeSlide, 'title', e.target.value)}
                    placeholder={slide.slide_type === 'cover' ? 'Frase gancho que frene el scroll' : slide.slide_type === 'cta' ? 'Call to action' : 'Titulo del punto'}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Copy</label>
                  <Textarea
                    value={slide.copy}
                    onChange={(e) => updateSlide(activeSlide, 'copy', e.target.value)}
                    placeholder={slide.slide_type === 'cover' ? 'Subtitulo / contexto' : slide.slide_type === 'cta' ? 'Seguime para mas / Link en bio / DM' : 'Desarrollo del punto (2-3 lineas)'}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Descripcion / Nota visual</label>
                  <Input
                    value={slide.description}
                    onChange={(e) => updateSlide(activeSlide, 'description', e.target.value)}
                    placeholder="Screenshot, icono, dato, etc."
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">URL de imagen (cover)</label>
                  <Input
                    value={slide.cover_url}
                    onChange={(e) => updateSlide(activeSlide, 'cover_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Color fondo</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={slide.bg_color} onChange={(e) => updateSlide(activeSlide, 'bg_color', e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                      <Input value={slide.bg_color} onChange={(e) => updateSlide(activeSlide, 'bg_color', e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Color texto</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={slide.text_color} onChange={(e) => updateSlide(activeSlide, 'text_color', e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
                      <Input value={slide.text_color} onChange={(e) => updateSlide(activeSlide, 'text_color', e.target.value)} className="flex-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Slide List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Slides</h3>
              <Button variant="outline" size="sm" onClick={addSlide}>
                <Plus className="mr-1 h-3 w-3" /> Agregar
              </Button>
            </div>
            {slides.map((s, i) => (
              <Card
                key={i}
                className={`cursor-pointer transition-all ${i === activeSlide ? 'ring-2 ring-primary' : 'hover:bg-accent/30'}`}
                onClick={() => setActiveSlide(i)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: s.bg_color, color: s.text_color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title || `Slide ${i + 1}`}</p>
                    <p className="text-xs text-muted-foreground">{SLIDE_TYPE_LABELS[s.slide_type]}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- LIST VIEW ---
  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carruseles</h1>
        <Button onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Carrusel</Button>
      </div>

      {carousels.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay carruseles. Crea el primero.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {carousels.map(c => (
            <Card key={c.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => openEditor(c)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.platform} · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{c.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteCarousel(c.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Carrusel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titulo del carrusel (ej: 5 errores al lanzar tu MVP)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">X/Twitter</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createCarousel} disabled={!newTitle.trim()} className="w-full">Crear Carrusel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
