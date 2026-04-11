import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Building2, Target, Palette, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface BusinessProfile {
  id?: string;
  user_id?: string;
  brand_name: string;
  tagline: string;
  services: string;
  price_range: string;
  ideal_client: string;
  differentiator: string;
  tone_and_style: string;
  brand_story: string;
  platforms: Record<string, string>;
  goals: string;
  avoid_topics: string;
}

const EMPTY_PROFILE: BusinessProfile = {
  brand_name: '',
  tagline: '',
  services: '',
  price_range: '',
  ideal_client: '',
  differentiator: '',
  tone_and_style: '',
  brand_story: '',
  platforms: {},
  goals: '',
  avoid_topics: '',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getBusinessProfile().then(res => {
      if (res.profile) setProfile(res.profile);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...profile, user_id: user?.id };
      const res = await api.saveBusinessProfile(payload);
      if (res.profile) setProfile(res.profile);
      toast({ title: 'Perfil guardado', description: 'Tu contexto de negocio se actualizó correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el perfil.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const update = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updatePlatform = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, platforms: { ...prev.platforms, [key]: value } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold">Configuracion</h1>
          <p className="text-sm text-muted-foreground">
            Este perfil alimenta toda la generacion AI. Cuanto mas completo, mejor el contenido.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      {/* Identidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Identidad del negocio</CardTitle>
              <CardDescription>Quien sos y que haces</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de marca</Label>
              <Input
                placeholder="Ej: Nexora"
                value={profile.brand_name}
                onChange={e => update('brand_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rango de precios</Label>
              <Input
                placeholder="Ej: $5K - $15K USD"
                value={profile.price_range}
                onChange={e => update('price_range', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              placeholder="Ej: Construimos tu MVP en semanas, no meses"
              value={profile.tagline}
              onChange={e => update('tagline', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Servicios</Label>
            <Textarea
              placeholder="Describí tus servicios principales. Ej: Diseño y desarrollo de MVPs, consultoría de producto, landing pages de alta conversión..."
              value={profile.services}
              onChange={e => update('services', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Historia / Background</Label>
            <Textarea
              placeholder="Tu historia, experiencia, por qué haces lo que haces. Esto le da personalidad al contenido."
              value={profile.brand_story}
              onChange={e => update('brand_story', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audiencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Audiencia y posicionamiento</CardTitle>
              <CardDescription>A quien le hablas y por que te eligen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente ideal</Label>
            <Textarea
              placeholder="Describí a tu cliente ideal. Ej: Founders early-stage en LATAM con una idea validada que necesitan un MVP funcional para levantar inversión..."
              value={profile.ideal_client}
              onChange={e => update('ideal_client', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Diferenciador</Label>
            <Textarea
              placeholder="¿Qué te hace diferente de la competencia? Ej: Combinamos AI + producto + velocidad. No somos una software factory, somos socios de producto..."
              value={profile.differentiator}
              onChange={e => update('differentiator', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Objetivos del contenido</Label>
            <Textarea
              placeholder="¿Qué querés lograr con tu contenido? Ej: Posicionarme como referente de MVPs en LATAM, atraer founders high-ticket, construir audiencia en LinkedIn y YouTube..."
              value={profile.goals}
              onChange={e => update('goals', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tono y estilo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Tono, estilo y limites</CardTitle>
              <CardDescription>Como hablas y que evitar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tono y estilo de comunicacion</Label>
            <Textarea
              placeholder="Ej: Directo, práctico, sin bullshit. Argentino pero profesional. Uso ejemplos reales. No soy motivacional, soy técnico y accionable..."
              value={profile.tone_and_style}
              onChange={e => update('tone_and_style', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Temas a evitar</Label>
            <Textarea
              placeholder="Ej: No hablar de vibe coding, no hacer tutoriales de herramientas, evitar contenido genérico de 'tips para emprendedores'..."
              value={profile.avoid_topics}
              onChange={e => update('avoid_topics', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Plataformas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Tus plataformas</CardTitle>
              <CardDescription>Links a tus perfiles sociales</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input
                placeholder="@tu-canal"
                value={profile.platforms?.youtube || ''}
                onChange={e => updatePlatform('youtube', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                placeholder="linkedin.com/in/tu-perfil"
                value={profile.platforms?.linkedin || ''}
                onChange={e => updatePlatform('linkedin', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X</Label>
              <Input
                placeholder="@tu-handle"
                value={profile.platforms?.twitter || ''}
                onChange={e => updatePlatform('twitter', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                placeholder="@tu-cuenta"
                value={profile.platforms?.instagram || ''}
                onChange={e => updatePlatform('instagram', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input
                placeholder="@tu-cuenta"
                value={profile.platforms?.tiktok || ''}
                onChange={e => updatePlatform('tiktok', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                placeholder="tu-sitio.com"
                value={profile.platforms?.website || ''}
                onChange={e => updatePlatform('website', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón final */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar perfil
        </Button>
      </div>
    </motion.div>
  );
}
