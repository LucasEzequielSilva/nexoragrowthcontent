import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({ title: '¡Cuenta creada!', description: 'Revisá tu email para confirmar.' });
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/80 to-primary border border-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.1)] brightness-110">
            <RocketLaunchIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Nexora Content Engine</CardTitle>
            <CardDescription className="mt-1">Tu sistema de operación de contenido</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
