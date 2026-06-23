import { useState } from 'react'
import { Outlet, Navigate, useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
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
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PieChart,
  LogOut,
  Activity,
  Settings,
  Shield,
  Users,
  User,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    try {
      setChangingPassword(true)
      await pb.collection('users').update(user.id, {
        oldPassword: oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      toast({ title: 'Senha atualizada com sucesso!' })
      setIsPasswordModalOpen(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({ title: 'Erro ao mudar senha.', description: error.message, variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const isMedico = user.role === 'medico'

  if (!isMedico && (location.pathname === '/dashboard' || location.pathname === '/relatorios')) {
    return <Navigate to="/financeiro" replace />
  }

  const navItems = isMedico
    ? [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Entradas', url: '/entradas', icon: TrendingUp },
        { title: 'Saídas', url: '/saidas', icon: TrendingDown },
        { title: 'Relatórios', url: '/relatorios', icon: PieChart },
        { title: 'Configurações', url: '/configuracoes', icon: Settings },
        { title: 'Usuários', url: '/usuarios', icon: Users },
        { title: 'Auditoria', url: '/log', icon: Shield },
      ]
    : [
        { title: 'Entradas', url: '/entradas', icon: TrendingUp },
        { title: 'Saídas', url: '/saidas', icon: TrendingDown },
      ]

  const handleLogout = () => {
    signOut()
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
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold uppercase">
                {user.name ? user.name.charAt(0) : user.email.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none text-foreground">
                  {user.name || user.email.split('@')[0]}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {user.role === 'medico' ? 'Médico' : 'Secretária'}
                </span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          <header className="h-16 flex items-center px-4 md:px-8 shrink-0 justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4 md:hidden" />
              <h1 className="font-semibold text-2xl text-foreground capitalize tracking-tight ml-2">
                {location.pathname.split('/')[1] || 'Dashboard'}
              </h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full border-border">
                  <User size={16} /> {user?.name || user?.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="cursor-pointer"
                >
                  Mudar Senha
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut size={16} className="mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8 pt-0 relative">
            <div className="mx-auto max-w-6xl w-full animate-fade-in-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mudar Senha</DialogTitle>
            <DialogDescription>Atualize sua senha de acesso ao sistema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Senha Atual</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="rounded-xl h-10"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={changingPassword} className="rounded-full">
                {changingPassword ? 'Salvando...' : 'Salvar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
