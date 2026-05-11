"use client"

import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings,
  Users,
  ChevronLeft,
  LogOut,
  Tv,
  Film,
  PlayCircle,
  Package
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
  },
  {
    id: "canais",
    title: "Canais TV",
    icon: Tv,
  },
  {
    id: "filmes",
    title: "Filmes",
    icon: Film,
  },
  {
    id: "series",
    title: "Séries",
    icon: PlayCircle,
  },
  {
    id: "pacotes",
    title: "Pacotes",
    icon: Package,
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
  },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout: () => void
}

export function AppSidebar({ activeSection, onSectionChange, onLogout }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-[0_0_10px_rgba(var(--primary),0.5)]">
            PRP
          </div>
          <span className={cn(
            "font-bold text-sidebar-foreground transition-opacity tracking-tight",
            isCollapsed && "opacity-0"
          )}>
            Revenda Pro
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.title}
                    className="cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Sair"
              className="cursor-pointer text-sidebar-muted hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="flex justify-end px-2 pb-2">
          <SidebarTrigger className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )} />
          </SidebarTrigger>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
