import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-8 shrink-0 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
            <SidebarTrigger className="mr-4 text-muted-foreground/60 hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 overflow-auto px-8 pb-12 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
