import {
  HomeIcon, CalendarIcon, LightBulbIcon, UserGroupIcon, DocumentTextIcon,
  BookmarkIcon, PhotoIcon, BookOpenIcon, Cog6ToothIcon, RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem { title: string; url: string; icon: HeroIcon; }

const mainNav: NavItem[] = [
  { title: 'Panel', url: '/', icon: HomeIcon },
  { title: 'Calendario', url: '/calendar', icon: CalendarIcon },
  { title: 'Ideas de Contenido', url: '/ideas', icon: LightBulbIcon },
  { title: 'Competidores', url: '/competitors', icon: UserGroupIcon },
  { title: 'Contenido Comp.', url: '/competitors/content', icon: DocumentTextIcon },
];

const toolsNav: NavItem[] = [
  { title: 'Pilares', url: '/pillars', icon: BookmarkIcon },
  { title: 'Carruseles', url: '/carousels', icon: PhotoIcon },
  { title: 'Briefs Semanales', url: '/briefs', icon: BookOpenIcon },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const renderNavGroup = (items: NavItem[], label?: string) => (
    <SidebarGroup>
      {label && !collapsed && (
        <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url === '/' ? location.pathname === '/' : location.pathname.startsWith(item.url);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <NavLink
                    to={item.url}
                    end={item.url === '/'}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-white/70 hover:text-foreground"
                    activeClassName="bg-white text-foreground font-semibold border border-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${isActive ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const isSettingsActive = location.pathname === '/settings';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm">
            <RocketLaunchIcon className="h-[18px] w-[18px] text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-foreground">Nexora</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        {renderNavGroup(mainNav)}
        {renderNavGroup(toolsNav, 'Herramientas')}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isSettingsActive}>
              <NavLink
                to="/settings"
                className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-white/60 hover:text-foreground"
                activeClassName="bg-white text-foreground font-semibold shadow-sm"
              >
                <Cog6ToothIcon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${isSettingsActive ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`} />
                {!collapsed && <span>Configuración</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <AccountSwitcher collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
