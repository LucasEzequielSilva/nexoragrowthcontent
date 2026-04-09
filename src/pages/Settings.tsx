import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Key, Bot, Download } from 'lucide-react';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <h1 className="text-[22px] font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Perfil</CardTitle>
              <CardDescription>Tu marca y perfiles sociales</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nombre de marca" defaultValue="Nexora" />
          <Input placeholder="YouTube Handle" defaultValue="@nexora" />
          <Input placeholder="LinkedIn URL" />
          <Input placeholder="X / Twitter Handle" />
          <Button>Guardar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>Claves de integración para scraping</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="YouTube API Key" type="password" />
          <Input placeholder="Twitter API Key" type="password" />
          <Input placeholder="LinkedIn API Key" type="password" />
          <p className="text-xs text-muted-foreground">Integraciones próximamente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Agente IA</CardTitle>
              <CardDescription>Configurá el agente para sugerencias de contenido</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Endpoint URL del agente" />
          <p className="text-xs text-muted-foreground">Integración próximamente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Exportar datos</CardTitle>
              <CardDescription>Descargá toda tu data de contenido</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Exportar todo (próximamente)</Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
