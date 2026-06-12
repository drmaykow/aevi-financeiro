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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { deleteCardMachine, createCardMachine } from '@/services/settings'

export default function Configuracoes() {
  const [machines, setMachines] = useState<CardMachine[]>([])
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Partial<CardMachine> | null>(null)
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

  const handleSaveMachine = async () => {
    if (!editingMachine?.name || !editingMachine?.settlement_mode) {
      return toast({ title: 'Preencha nome e modo de recebimento', variant: 'destructive' })
    }
    try {
      const data = {
        name: editingMachine.name,
        settlement_mode: editingMachine.settlement_mode,
        fees: editingMachine.fees || {},
      }
      if (editingMachine.id) {
        await updateCardMachine(editingMachine.id, data)
        toast({ title: 'Maquininha atualizada' })
      } else {
        await createCardMachine(data)
        toast({ title: 'Maquininha adicionada' })
      }
      setIsMachineModalOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao salvar maquininha', variant: 'destructive' })
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
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingMachine({
                  name: '',
                  settlement_mode: 'ANTECIPADO',
                  fees: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 0])),
                })
                setIsMachineModalOpen(true)
              }}
              className="rounded-xl font-bold h-10 bg-primary hover:bg-primary/90 shadow-md text-white"
            >
              Adicionar Maquininha
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="bg-white p-5 rounded-2xl border border-border/50 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{machine.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {machine.settlement_mode === 'ANTECIPADO'
                        ? 'Antecipado (D+1)'
                        : 'Parcelado (Fluxo)'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMachine({
                          ...machine,
                          fees: {
                            ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 0])),
                            ...machine.fees,
                          },
                        })
                        setIsMachineModalOpen(true)
                      }}
                      className="text-primary hover:bg-primary/10 rounded-lg h-8 px-2"
                    >
                      Editar
                    </Button>
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
                      className="text-destructive hover:bg-destructive/10 rounded-lg h-8 px-2"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const inst = i + 1
                    return (
                      <div
                        key={inst}
                        className="text-center bg-muted/30 p-1.5 rounded-lg border border-border"
                      >
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          {inst}x
                        </div>
                        <div className="text-xs font-bold">{machine.fees[inst] || 0}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
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

      <Dialog open={isMachineModalOpen} onOpenChange={setIsMachineModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMachine?.id ? 'Editar' : 'Nova'} Maquininha</DialogTitle>
          </DialogHeader>
          {editingMachine && (
            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nome</label>
                  <Input
                    value={editingMachine.name || ''}
                    onChange={(e) => setEditingMachine({ ...editingMachine, name: e.target.value })}
                    placeholder="Ex: Stone, PagSeguro"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Modo de Recebimento</label>
                  <Select
                    value={editingMachine.settlement_mode}
                    onValueChange={(v: 'ANTECIPADO' | 'PARCELADO') =>
                      setEditingMachine({ ...editingMachine, settlement_mode: v })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione o modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANTECIPADO">ANTECIPADO (D+1 ou similar)</SelectItem>
                      <SelectItem value="PARCELADO">PARCELADO (Fluxo D+30, D+60)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 text-primary">Taxas por Parcela (%)</h4>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const inst = i + 1
                    return (
                      <div
                        key={inst}
                        className="space-y-1.5 bg-muted/20 p-2 rounded-xl border border-border"
                      >
                        <label className="text-xs font-semibold text-muted-foreground block text-center">
                          {inst}x
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editingMachine.fees?.[inst] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : 0
                            setEditingMachine({
                              ...editingMachine,
                              fees: { ...(editingMachine.fees || {}), [inst]: val },
                            })
                          }}
                          className="h-8 text-center rounded-lg bg-white shadow-sm border-transparent"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveMachine} className="rounded-xl font-bold">
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
