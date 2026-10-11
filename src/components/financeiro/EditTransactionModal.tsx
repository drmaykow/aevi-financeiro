import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getCardMachines, getProcedures, CardMachine, Procedure } from '@/services/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronsUpDown } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface EditTransactionModalProps {
  transaction: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [machines, setMachines] = useState<CardMachine[]>([])
  const [proceduresList, setProceduresList] = useState<Procedure[]>([])

  useEffect(() => {
    if (open) {
      Promise.all([getCardMachines(), getProcedures()])
        .then(([m, p]) => {
          setMachines(m)
          setProceduresList(p)
        })
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (transaction) {
      let initialProcedures: string[] = []
      if (Array.isArray(transaction.procedures)) {
        initialProcedures = transaction.procedures
      } else if (
        typeof transaction.procedures === 'string' &&
        transaction.procedures.trim() !== ''
      ) {
        try {
          const parsed = JSON.parse(transaction.procedures)
          if (Array.isArray(parsed)) {
            initialProcedures = parsed
          } else {
            initialProcedures = [transaction.procedures.trim()]
          }
        } catch {
          initialProcedures = [transaction.procedures.trim()]
        }
      }

      setFormData({
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        category: transaction.category || '',
        patient: transaction.patient || '',
        doctor: transaction.doctor || '',
        patient_source: transaction.patient_source || '',
        procedures: initialProcedures,
        payment_method: transaction.payment_method || '',
        card_machine: transaction.card_machine || '',
        installments: transaction.installments || 1,
      })
    }
  }, [transaction])

  const handleSubmit = async () => {
    if (!transaction?.id) return
    setLoading(true)
    try {
      const amount = Number(formData.amount)
      let payload: any = {
        date: formData.date ? `${formData.date} 12:00:00.000Z` : transaction.date,
        amount,
        description: formData.description,
        category: formData.category,
        patient: formData.patient,
        doctor: formData.doctor,
        procedures: Array.isArray(formData.procedures) ? formData.procedures : [],
        patient_source: formData.patient_source,
        payment_method: formData.payment_method,
      }

      if (formData.payment_method === 'CARTÃO DE CRÉDITO') {
        const machine = machines.find((m) => m.id === formData.card_machine)
        const inst = Number(formData.installments) || 1
        let feePercent = 0
        if (machine && machine.fees && machine.fees[inst.toString()] !== undefined) {
          feePercent = Number(machine.fees[inst.toString()])
        }

        const feeAmount = (amount * feePercent) / 100
        const netAmount = amount - feeAmount

        payload.card_machine = formData.card_machine
        payload.installments = inst
        payload.card_fee_percent = feePercent
        payload.card_fee_amount = feeAmount
        payload.net_amount = netAmount
      } else if (transaction.type === 'entry') {
        payload.card_machine = null
        payload.installments = null
        payload.card_fee_percent = 0
        payload.card_fee_amount = 0
        payload.net_amount = amount
      }

      await pb.collection('transactions').update(transaction.id, payload)
      toast({ title: 'Sucesso', description: 'Registro atualizado com sucesso.' })
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e.message || 'Falha ao atualizar.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  const filteredProcedures = proceduresList.filter((p) => {
    if (!formData.doctor) return true
    const docClean = formData.doctor.trim().toLowerCase()
    if (docClean.includes('maykow')) return p.doctor.toLowerCase().includes('maykow')
    if (docClean.includes('ana')) return p.doctor.toLowerCase().includes('ana')
    return p.doctor === formData.doctor
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary mb-4">
            Editar Lançamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl h-11 bg-muted/50 border-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label>Valor</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="rounded-xl h-11 bg-muted/50 border-transparent"
            />
          </div>
          {transaction.type === 'exit' && (
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl h-11 bg-muted/50 border-transparent"
              />
            </div>
          )}
          {transaction.type === 'entry' && (
            <>
              <div className="space-y-2">
                <Label>Paciente</Label>
                <Input
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  className="rounded-xl h-11 bg-muted/50 border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select
                  value={formData.doctor}
                  onValueChange={(val) => setFormData({ ...formData, doctor: val })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Maykow">Dr. Maykow</SelectItem>
                    <SelectItem value="Dra. Ana Cláudia">Dra. Ana Cláudia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                    <SelectItem value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_method === 'CARTÃO DE CRÉDITO' && (
                <>
                  <div className="space-y-2">
                    <Label>Máquininha</Label>
                    <Select
                      value={formData.card_machine}
                      onValueChange={(val) => setFormData({ ...formData, card_machine: val })}
                    >
                      <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                        <SelectValue placeholder="Selecione a máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((m) => (
                          <SelectItem key={m.id} value={m.id!}>
                            {m.name} {m.settlement_mode ? `(${m.settlement_mode})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select
                      value={String(formData.installments || 1)}
                      onValueChange={(val) =>
                        setFormData({ ...formData, installments: Number(val) })
                      }
                    >
                      <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                        <SelectValue placeholder="Selecione as parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Origem do Paciente</Label>
                <Select
                  value={formData.patient_source}
                  onValueChange={(val) => setFormData({ ...formData, patient_source: val })}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'Google',
                      'Já é paciente',
                      'Médico(a)',
                      'Paciente',
                      'Facebook',
                      'Instagram',
                      'Tik Tok',
                      'Chat GPT',
                      'Youtube',
                      'Doctorália',
                      'ECO',
                      'Desconhecido',
                      'Outros',
                    ].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Procedimentos / Consultas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-full justify-between h-auto min-h-11 px-3 py-2 rounded-xl bg-muted/50 border-transparent hover:bg-muted/70',
                        !formData.procedures?.length && 'text-muted-foreground',
                      )}
                    >
                      {formData.procedures && formData.procedures.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {formData.procedures.map((val: string) => (
                            <Badge
                              key={val}
                              variant="secondary"
                              className="font-normal bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                            >
                              {val}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        'Selecione os procedimentos...'
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="max-h-[240px] overflow-y-auto p-1">
                      {filteredProcedures.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Nenhum procedimento encontrado.
                        </div>
                      ) : (
                        filteredProcedures.map((p) => {
                          const isSelected = (formData.procedures || []).includes(p.name)
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                                isSelected && 'bg-accent/50 font-medium',
                              )}
                              onClick={() => {
                                const current: string[] = formData.procedures || []
                                const updated = isSelected
                                  ? current.filter((val) => val !== p.name)
                                  : [...current, p.name]
                                setFormData({ ...formData, procedures: updated })
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 text-secondary',
                                  isSelected ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {p.name}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              loading || (formData.payment_method === 'CARTÃO DE CRÉDITO' && !formData.card_machine)
            }
            className="w-full rounded-full bg-primary hover:bg-primary/90 h-11 mt-4"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
