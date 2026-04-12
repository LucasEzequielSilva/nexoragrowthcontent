import {
  HomeIcon, CalendarIcon, LightBulbIcon, UserGroupIcon, DocumentTextIcon,
  BookmarkIcon, PhotoIcon, BookOpenIcon, Cog6ToothIcon, RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
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

const CollapseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
  </svg>
);

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
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                    activeClassName="bg-accent text-foreground font-semibold border border-border shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-all duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`} />
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
      <SidebarHeader className={collapsed ? "p-2 pb-1 flex justify-center" : "p-4 pb-2"}>
        {collapsed ? (
          /* Collapsed: solo isotipo centrado */
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/80 to-primary border border-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.1)] brightness-110 transition-all duration-200 hover:brightness-100"
          >
            <RocketLaunchIcon className="h-[18px] w-[18px] text-white" />
          </button>
        ) : (
          /* Expanded: isotipo + nombre + botón colapsar */
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/80 to-primary border border-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),inset_0_-1px_0_0_rgba(0,0,0,0.1)] brightness-110">
              <RocketLaunchIcon className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-foreground">Nexora</span>
              <button onClick={toggleSidebar} className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent border border-border shadow-[0_1px_3px_rgba(0,0,0,0.2)] text-muted-foreground hover:text-foreground transition-all duration-200">
                <CollapseIcon />
              </button>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={`pt-2 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {renderNavGroup(mainNav)}
        {renderNavGroup(toolsNav, collapsed ? undefined : 'Herramientas')}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isSettingsActive}>
              <NavLink
                to="/settings"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                activeClassName="bg-accent text-foreground font-semibold border border-border shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
              >
                <Cog6ToothIcon className={`h-[18px] w-[18px] shrink-0 transition-all duration-200 ${isSettingsActive ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`} />
                {!collapsed && <span>Configuración</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && <AccountSwitcher collapsed={false} />}
      </SidebarFooter>
    </Sidebar>
  );
}
