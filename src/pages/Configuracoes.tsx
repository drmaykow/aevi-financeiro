import { useState, useEffect } from 'react'
import {
  getCardMachines,
  updateCardMachine,
  getProcedures,
  createProcedure,
  updateProcedure,
  CardMachine,
  Procedure,
} from '@/services/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { deleteCardMachine, createCardMachine } from '@/services/settings'

export default function Configuracoes() {
  const [machines, setMachines] = useState<CardMachine[]>([])
  const [newMachineName, setNewMachineName] = useState('')
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [newProc, setNewProc] = useState<Partial<Procedure>>({ active: true })
  const { toast } = useToast()

  const loadData = async () => {
    const [m, p] = await Promise.all([getCardMachines(), getProcedures()])
    setMachines(m)
    setProcedures(p)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateFee = async (machineId: string, inst: number, fee: number) => {
    const machine = machines.find((m) => m.id === machineId)
    if (!machine) return
    try {
      await updateCardMachine(machineId, { fees: { ...machine.fees, [inst]: fee } })
      toast({ title: 'Taxa atualizada' })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleAddProc = async () => {
    if (!newProc.name || !newProc.doctor || !newProc.category)
      return toast({ title: 'Preencha todos os campos', variant: 'destructive' })
    try {
      await createProcedure(newProc)
      toast({ title: 'Procedimento adicionado' })
      setNewProc({ active: true })
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleToggleProc = async (id: string, active: boolean) => {
    try {
      await updateProcedure(id, { active })
      loadData()
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <Card className="rounded-3xl border-none shadow-subtle bg-white/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Maquininhas de Cartão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 items-end bg-muted/30 p-4 rounded-2xl border border-border">
            <div className="flex-1">
              <label className="text-xs font-semibold">Nova Maquininha</label>
              <Input
                value={newMachineName}
                onChange={(e) => setNewMachineName(e.target.value)}
                placeholder="Nome da maquininha"
                className="bg-white rounded-xl h-10 mt-1 shadow-sm border-transparent"
              />
            </div>
            <Button
              onClick={async () => {
                if (!newMachineName)
                  return toast({ title: 'Preencha o nome', variant: 'destructive' })
                try {
                  await createCardMachine({ name: newMachineName, fees: {} })
                  toast({ title: 'Maquininha adicionada' })
                  setNewMachineName('')
                  loadData()
                } catch {
                  toast({ title: 'Erro ao adicionar', variant: 'destructive' })
                }
              }}
              className="rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 shadow-md text-white"
            >
              Adicionar
            </Button>
          </div>
          {machines.map((machine) => (
            <div key={machine.id} className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-primary">{machine.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!window.confirm('Excluir maquininha?')) return
                    try {
                      await deleteCardMachine(machine.id!)
                      toast({ title: 'Maquininha removida' })
                      loadData()
                    } catch {
                      toast({ title: 'Erro ao remover', variant: 'destructive' })
                    }
                  }}
                  className="text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  Excluir
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const inst = i + 1
                  return (
                    <div
                      key={inst}
                      className="space-y-1 bg-muted/30 p-3 rounded-2xl border border-border"
                    >
                      <label className="text-xs font-semibold text-muted-foreground">
                        {inst}x (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={machine.fees[inst] || 0}
                        onBlur={(e) => handleUpdateFee(machine.id!, inst, Number(e.target.value))}
                        className="bg-white rounded-xl h-10 border-transparent shadow-sm"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-subtle bg-white/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Procedimentos e Consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end bg-muted/30 p-4 rounded-2xl border border-border">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold">Nome</label>
              <Input
                value={newProc.name || ''}
                onChange={(e) => setNewProc({ ...newProc, name: e.target.value })}
                className="bg-white rounded-xl h-10 mt-1 shadow-sm border-transparent"
              />
            </div>
            <div className="w-[150px]">
              <label className="text-xs font-semibold">Médico</label>
              <Select
                value={newProc.doctor}
                onValueChange={(v) => setNewProc({ ...newProc, doctor: v as any })}
              >
                <SelectTrigger className="bg-white rounded-xl h-10 mt-1 shadow-sm border-transparent">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. Maykow">Dr. Maykow</SelectItem>
                  <SelectItem value="Dra. Ana Cláudia">Dra. Ana Cláudia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <label className="text-xs font-semibold">Categoria</label>
              <Select
                value={newProc.category}
                onValueChange={(v) => setNewProc({ ...newProc, category: v as any })}
              >
                <SelectTrigger className="bg-white rounded-xl h-10 mt-1 shadow-sm border-transparent">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTAS">CONSULTAS</SelectItem>
                  <SelectItem value="DIU">DIU</SelectItem>
                  <SelectItem value="IMPLANON">IMPLANON</SelectItem>
                  <SelectItem value="PROCEDIMENTOS">PROCEDIMENTOS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddProc}
              className="rounded-xl font-bold h-10 bg-secondary hover:bg-secondary/90 shadow-md"
            >
              Adicionar
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {['Dr. Maykow', 'Dra. Ana Cláudia'].map((doc) => (
              <div key={doc} className="space-y-3">
                <h3 className="font-bold text-lg text-primary">{doc}</h3>
                <div className="space-y-2">
                  {procedures
                    .filter((p) => p.doctor === doc)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3 bg-white border border-border/50 rounded-xl shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                          <Switch
                            checked={p.active}
                            onCheckedChange={(v) => handleToggleProc(p.id!, v)}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
