import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, LogOut, Plus, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedAccount {
  email: string;
  /** base64-encoded password — internal tool only */
  k: string;
}

const STORAGE_KEY = 'nexora_accounts';

function getAccounts(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function setAccounts(accounts: SavedAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function upsertAccount(email: string, password: string) {
  const accounts = getAccounts();
  const k = btoa(password);
  const idx = accounts.findIndex(a => a.email === email);
  if (idx >= 0) accounts[idx].k = k;
  else accounts.push({ email, k });
  setAccounts(accounts);
}

function removeAccount(email: string) {
  setAccounts(getAccounts().filter(a => a.email !== email));
}

function getInitials(email: string): string {
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string): string {
  return email.split('@')[0];
}

interface Props { collapsed?: boolean; }

export function AccountSwitcher({ collapsed = false }: Props) {
  const { user, signOut, setSwitching: setAuthSwitching } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [switching, setSwitchingLocal] = useState(false);

  const setSwitching = (v: boolean) => {
    setSwitchingLocal(v);
    setAuthSwitching(v);
  };

  const currentEmail = user?.email || '';
  const otherAccounts = getAccounts().filter(a => a.email !== currentEmail);

  const switchTo = async (account: SavedAccount) => {
    setSwitching(true);
    try {
      const pw = atob(account.k);
      // Sign out current session first, then sign in with stored credentials
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email: account.email, password: pw });
      if (error) {
        removeAccount(account.email);
        toast({ title: 'Error', description: 'Credenciales inválidas. Agregá la cuenta de nuevo.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Switch error:', err);
      toast({ title: 'Error al cambiar cuenta', variant: 'destructive' });
    } finally {
      setSwitching(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !addPassword) return;
    setSwitching(true);
    try {
      // Save current account before switching
      if (currentEmail) {
        const current = getAccounts().find(a => a.email === currentEmail);
        if (!current) {
          // Can't save without password, but at least don't lose it if already saved
        }
      }
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email: addEmail, password: addPassword });
      if (error) throw error;
      upsertAccount(addEmail, addPassword);
      toast({ title: 'Cuenta agregada', description: addEmail });
      setShowAddDialog(false);
      setAddEmail('');
      setAddPassword('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSwitching(false);
    }
  };

  const handleSignOut = async () => {
    removeAccount(currentEmail);
    await signOut();
  };

  const addDialog = (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddAccount} className="space-y-3">
          <Input type="email" placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
          <Input type="password" placeholder="Contraseña" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={switching}>
            {switching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agregar y entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const openAdd = () => { setAddEmail(''); setAddPassword(''); setShowAddDialog(true); };

  // --- Collapsed ---
  if (collapsed) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {getInitials(currentEmail)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{getDisplayName(currentEmail)}</p>
              <p className="text-xs text-muted-foreground">{currentEmail}</p>
            </div>
            <DropdownMenuSeparator />
            {otherAccounts.map(acc => (
              <DropdownMenuItem key={acc.email} onClick={() => switchTo(acc)} disabled={switching}>
                <Avatar className="h-5 w-5 mr-2"><AvatarFallback className="text-[8px]">{getInitials(acc.email)}</AvatarFallback></Avatar>
                {getDisplayName(acc.email)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Agregar cuenta</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {addDialog}
      </>
    );
  }

  // --- Expanded ---
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-accent/50 transition-colors bg-accent border border-border shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{getInitials(currentEmail)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getDisplayName(currentEmail)}</p>
              <p className="text-[11px] text-muted-foreground truncate">{currentEmail}</p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">{getInitials(currentEmail)}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getDisplayName(currentEmail)}</p>
              <p className="text-[11px] text-muted-foreground truncate">{currentEmail}</p>
            </div>
            <Check className="h-4 w-4 text-primary shrink-0" />
          </div>

          {otherAccounts.length > 0 && <DropdownMenuSeparator />}

          {otherAccounts.map(acc => (
            <DropdownMenuItem key={acc.email} onClick={() => switchTo(acc)} disabled={switching} className="gap-2">
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[9px]">{getInitials(acc.email)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{getDisplayName(acc.email)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{acc.email}</p>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openAdd} className="gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/30">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <span>Agregar cuenta</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" /><span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {addDialog}
    </>
  );
}
