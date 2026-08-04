import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import { getMicroscopiaPatients, PatientMicroscopia } from '@/services/microscopia'
import { formatCurrency, formatDate } from '@/lib/utils'
import { HeaderNav } from '@/components/financeiro/HeaderNav'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

function getCycleLabel(index: number): string {
  const cycle = (index % 3) + 1
  const suffix = cycle === 1 ? 'ª' : cycle === 2 ? 'ª' : 'ª'
  return `${cycle}${suffix} lâmina`
}

function CycleBadge({ count }: { count: number }) {
  if (count === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
        🟢 1
      </span>
    )
  }
  if (count === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
        🟡 2
      </span>
    )
  }
  return (
    <span className="inline-flex items-col gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-300 shadow-sm animate-fade-in">
      🔴 3 — Lembrar de cobrar nova consulta
    </span>
  )
}

function HistoryModal({
  patient,
  open,
  onOpenChange,
}: {
  patient: PatientMicroscopia | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!patient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Histórico — {patient.patient}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
          {patient.records.map((record, idx) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50"
            >
              <span className="font-semibold text-sm text-foreground">{getCycleLabel(idx)}</span>
              <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MicroscopiaControle() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [patients, setPatients] = useState<PatientMicroscopia[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<PatientMicroscopia | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await getMicroscopiaPatients()
      setPatients(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
        oldPassword,
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

  const openHistory = (patient: PatientMicroscopia) => {
    setSelectedPatient(patient)
    setModalOpen(true)
  }

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.trim()
    if (!q) return true
    if (q === '1' || q === '2' || q === '3') {
      return p.cycleCount === Number(q)
    }
    return p.patient.toLowerCase().includes(q.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Controle de Microscopia
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acompanhamento de ciclos por paciente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HeaderNav />
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
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-lg">
              Nenhum paciente com microscopia encontrado.
            </p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Registros aparecerão aqui automaticamente quando houver lançamentos com o procedimento
              "Microscopia".
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por paciente ou contagem (1, 2, 3)..."
                className="rounded-full pl-12 h-12 bg-white/60 backdrop-blur-md border-border"
              />
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-elevation overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Paciente</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground text-center">
                        Contagem
                      </th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">
                        Data da Última Coleta
                      </th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground text-center">
                        Histórico
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => (
                      <tr
                        key={p.patient}
                        className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${
                          p.cycleCount >= 2 ? 'bg-yellow-50/50' : ''
                        } ${p.cycleCount === 3 ? 'bg-red-50/60' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">{p.patient}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {p.cycleCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(p.lastDate)}
                        </td>
                        <td className="px-4 py-3">
                          <CycleBadge count={p.cycleCount} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openHistory(p)}
                            className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                          >
                            <Clock size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <HistoryModal patient={selectedPatient} open={modalOpen} onOpenChange={setModalOpen} />

        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle>Mudar Senha</DialogTitle>
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
              <div className="flex justify-end gap-2 pt-4">
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
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
