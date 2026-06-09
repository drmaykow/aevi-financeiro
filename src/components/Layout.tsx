import { Outlet, Navigate, useLocation, Link, useNavigate } from 'react-router-dom'
import useMainStore from '@/stores/main'
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
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, LogOut, Activity } from 'lucide-react'

export default function Layout() {
  const { user, setUser } = useMainStore()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) {
    return <Navigate to="/" replace />
  }

  const isMedico = user.role === 'MEDICO'

  if (!isMedico && (location.pathname === '/dashboard' || location.pathname === '/relatorios')) {
    return <Navigate to="/entradas" replace />
  }

  const navItems = isMedico
    ? [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Entradas', url: '/entradas', icon: TrendingUp },
        { title: 'Saídas', url: '/saidas', icon: TrendingDown },
        { title: 'Relatórios', url: '/relatorios', icon: PieChart },
      ]
    : [
        { title: 'Entradas', url: '/entradas', icon: TrendingUp },
        { title: 'Saídas', url: '/saidas', icon: TrendingDown },
      ]

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r-0 shadow-sm">
          <SidebarHeader className="p-4 flex flex-row items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Activity size={24} />
            </div>
            <span className="font-semibold text-lg text-foreground tracking-tight">
              Aevi Financeiro
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2 px-2">
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname.startsWith(item.url)}
                        className="rounded-xl transition-transform hover:translate-x-1 duration-200 h-10"
                      >
                        <Link to={item.url}>
                          <item.icon className="mr-2" size={18} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none text-foreground">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {user.role === 'MEDICO' ? 'Médico' : 'Secretária'}
                </span>
              </div>
            </div>
            <SidebarMenuButton
              onClick={handleLogout}
              className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} className="mr-2" />
              <span className="font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          <header className="h-16 flex items-center px-4 md:px-8 shrink-0">
            <SidebarTrigger className="mr-4 md:hidden" />
            <div className="flex-1">
              <h1 className="font-semibold text-2xl text-foreground capitalize tracking-tight">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8 pt-0 relative">
            <div className="mx-auto max-w-6xl w-full animate-fade-in-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
