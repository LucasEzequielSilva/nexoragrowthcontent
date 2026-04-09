import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { User, Key, Bot, Download } from 'lucide-react';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your brand and social handles</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Brand Name" defaultValue="Nexora" />
          <Input placeholder="YouTube Handle" defaultValue="@nexora" />
          <Input placeholder="LinkedIn URL" />
          <Input placeholder="X/Twitter Handle" />
          <Button>Save Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>Integration keys for data collection</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="YouTube API Key" type="password" />
          <Input placeholder="Twitter API Key" type="password" />
          <Input placeholder="LinkedIn API Key" type="password" />
          <p className="text-xs text-muted-foreground">API integrations coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Agent Configuration</CardTitle>
              <CardDescription>Configure AI agent for content suggestions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Agent Endpoint URL" />
          <p className="text-xs text-muted-foreground">Agent integration coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Export Data</CardTitle>
              <CardDescription>Download all your content data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="secondary">Export All Data (Coming Soon)</Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
