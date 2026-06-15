import { useState, useEffect } from 'react'
import { getUsers, deleteUser, createUser, updateUserPassword, UserRecord } from '@/services/users'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, KeyRound, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function Usuarios() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditPassOpen, setIsEditPassOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  const [editUserName, setEditUserName] = useState('')
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editUserRole, setEditUserRole] = useState('secretaria')

  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('secretaria')

  const [editPassword, setEditPassword] = useState('')
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res)
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || newUserPassword.length < 8) {
      return toast({
        title: 'Atenção',
        description: 'Preencha o e-mail e uma senha de no mínimo 8 caracteres.',
        variant: 'destructive',
      })
    }
    try {
      await createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      })
      toast({ title: 'Sucesso', description: 'Usuário criado com sucesso' })
      setIsCreateOpen(false)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('secretaria')
      loadUsers()
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Erro ao criar usuário',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePassword = async () => {
    if (!selectedUser || editPassword.length < 8) {
      return toast({
        title: 'Atenção',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
    }
    try {
      await updateUserPassword(selectedUser.id, editPassword)
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso' })
      setIsEditPassOpen(false)
      setEditPassword('')
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Erro ao atualizar senha',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este usuário?')) return
    try {
      await deleteUser(id)
      toast({ title: 'Sucesso', description: 'Usuário removido' })
      loadUsers()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao remover usuário', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-elevation hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-white h-10 px-6">
              <Plus className="mr-2" size={18} /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary mb-4">
                Criar Novo Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  type="email"
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Médico (Admin)</SelectItem>
                    <SelectItem value="secretaria">Secretária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateUser}
                className="w-full rounded-full bg-primary hover:bg-primary/90 h-11 mt-4"
              >
                Criar Conta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="font-semibold">Perfil</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50 border-border/50">
                  <TableCell className="font-medium text-foreground">{u.name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium border-0 ${u.role === 'medico' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}
                    >
                      {u.role === 'medico' ? 'Médico' : 'Secretária'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 text-muted-foreground hover:bg-muted"
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-xl shadow-elevation border-0"
                      >
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer flex items-center"
                          onClick={() => {
                            setSelectedUser(u)
                            setEditUserName(u.name || '')
                            setEditUserEmail(u.email || '')
                            setEditUserRole(u.role || 'secretaria')
                            setIsEditUserOpen(true)
                          }}
                        >
                          <MoreHorizontal size={16} className="mr-2 text-primary" /> Editar Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer flex items-center"
                          onClick={() => {
                            setSelectedUser(u)
                            setIsEditPassOpen(true)
                          }}
                        >
                          <KeyRound size={16} className="mr-2 text-secondary" /> Editar Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          <Trash2 size={16} className="mr-2" /> Excluir Usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary mb-4">
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                placeholder="Nome completo"
                className="rounded-xl h-11 bg-muted/50 border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                placeholder="usuario@email.com"
                type="email"
                className="rounded-xl h-11 bg-muted/50 border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medico">Médico (Admin)</SelectItem>
                  <SelectItem value="secretaria">Secretária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={async () => {
                if (!selectedUser) return
                try {
                  const pb = (await import('@/lib/pocketbase/client')).default
                  await pb.send(`/backend/v1/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                      name: editUserName,
                      email: editUserEmail,
                      role: editUserRole,
                    }),
                  })
                  setIsEditUserOpen(false)
                  loadUsers()
                  toast({ title: 'Sucesso', description: 'Usuário atualizado com sucesso' })
                } catch (e: any) {
                  toast({
                    title: 'Erro',
                    description: e.message || 'Erro ao atualizar',
                    variant: 'destructive',
                  })
                }
              }}
              className="w-full rounded-full bg-primary hover:bg-primary/90 h-11 mt-4"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPassOpen} onOpenChange={setIsEditPassOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="rounded-xl h-11 bg-muted/50 border-transparent"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              className="w-full rounded-full bg-secondary hover:bg-secondary/90 h-11"
            >
              Salvar Nova Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
