import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { LogOut, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getRecentTransactions,
  deleteTransaction,
  TransactionRecord,
} from '@/services/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ConsultaForm } from '@/components/financeiro/ConsultaForm'
import { EditTransactionModal } from '@/components/financeiro/EditTransactionModal'
import { Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function FinanceiroSecretaria() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [view, setView] = useState<'home' | 'consulta'>('home')
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null)

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const loadData = async () => {
    try {
      const res = await getRecentTransactions()
      setTransactions(res.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('transactions', () => {
    loadData()
  })

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

  const renderView = () => {
    if (view === 'consulta')
      return <ConsultaForm onSuccess={() => setView('home')} onCancel={() => setView('home')} />

    return (
      <div className="max-w-lg mx-auto mt-4 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 gap-4">
          <Button
            onClick={() => setView('consulta')}
            className="h-32 text-xl font-bold rounded-3xl bg-green-600 text-white shadow-lg hover:bg-green-700 hover:scale-[1.02] flex flex-col gap-2"
          >
            <span className="text-3xl">+</span> NOVA ENTRADA
          </Button>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-elevation">
          <h3 className="text-lg font-bold mb-4 text-foreground">Últimos Lançamentos</h3>
          {transactions.filter(
            (tx) =>
              tx.type === 'entry' || (tx.type === 'exit' && tx.category === 'ESTORNO DE TAXA'),
          ).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum lançamento encontrado.</p>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter(
                  (tx) =>
                    tx.type === 'entry' ||
                    (tx.type === 'exit' && tx.category === 'ESTORNO DE TAXA'),
                )
                .slice(0, 20)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-white rounded-2xl shadow-sm border border-border/50"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-sm truncate">
                        {tx.type === 'entry'
                          ? tx.entry_type || tx.doctor
                          : tx.category === 'ESTORNO DE TAXA'
                            ? '↩️ Estorno de Taxa'
                            : tx.category}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {tx.patient || tx.description}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground/70 whitespace-nowrap ml-2">
                          {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <div className="flex flex-col items-end text-right">
                        <span
                          className={`font-bold ${tx.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {tx.type === 'entry' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                        {tx.payment_method && (
                          <span className="text-xs font-medium text-muted-foreground/70 mt-0.5">
                            {tx.payment_method}
                          </span>
                        )}
                      </div>
                      {(!tx.created ||
                        Date.now() - new Date(tx.created.replace(' ', 'T')).getTime() <=
                          48 * 3600 * 1000) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTx(tx)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que quer apagar este lançamento?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => tx.id && deleteTransaction(tx.id).then(loadData)}
                                  className="bg-destructive text-white rounded-full hover:bg-destructive/90"
                                >
                                  Apagar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <EditTransactionModal
          transaction={editingTx}
          open={!!editingTx}
          onOpenChange={(op) => !op && setEditingTx(null)}
          onSuccess={loadData}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Aevi Financeiro</h1>
            <p className="text-muted-foreground mt-1">Gestão Diária de Caixa</p>
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
                onClick={() => {
                  signOut()
                  navigate('/')
                }}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut size={16} className="mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        {renderView()}

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
      </div>
    </div>
  )
}
