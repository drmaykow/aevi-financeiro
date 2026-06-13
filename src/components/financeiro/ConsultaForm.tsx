import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { createTransaction } from '@/services/transactions'
import { getCardMachines, getProcedures, CardMachine, Procedure } from '@/services/settings'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

const schema = z
  .object({
    date: z.string().min(1, 'Preencha este campo'),
    doctor: z.string().min(1, 'Preencha este campo'),
    patient: z.string().min(1, 'Informe o nome da paciente'),
    patient_source: z.string().optional(),
    procedures: z.array(z.string()).min(1, 'Selecione ao menos um procedimento'),
    amount: z.coerce.number().min(0.01, 'Preencha este campo'),
    payment_method: z.enum(['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO'], {
      required_error: 'Preencha este campo',
    }),
    card_machine: z.string().optional(),
    installments: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      if (data.payment_method === 'CARTÃO DE CRÉDITO' && (!data.card_machine || !data.installments))
        return false
      return true
    },
    { message: 'Preencha os dados do cartão', path: ['card_machine'] },
  )

const getLocalDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function ConsultaForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [machines, setMachines] = useState<CardMachine[]>([])
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([])
  const [feeCalc, setFeeCalc] = useState({ percent: 0, amount: 0, net: 0 })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: getLocalDate(),
      doctor: '',
      patient: '',
      patient_source: undefined,
      procedures: [],
      amount: 0,
      payment_method: undefined,
    },
  })

  useEffect(() => {
    getCardMachines().then(setMachines)
    getProcedures().then((res) => setAllProcedures(res.filter((p) => p.active)))
  }, [])

  const doc = form.watch('doctor')
  const amount = form.watch('amount')
  const payment = form.watch('payment_method')
  const machineId = form.watch('card_machine')
  const inst = form.watch('installments')

  useEffect(() => {
    if (payment === 'CARTÃO DE CRÉDITO' && machineId && inst && amount) {
      const machine = machines.find((m) => m.id === machineId)
      const percent = machine?.fees[String(inst)] || 0
      const feeAmount = amount * (percent / 100)
      setFeeCalc({ percent, amount: feeAmount, net: amount - feeAmount })
    } else {
      setFeeCalc({ percent: 0, amount: 0, net: amount || 0 })
    }
  }, [payment, machineId, inst, amount, machines])

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createTransaction({
        type: 'entry',
        entry_type: 'CONSULTA/PROCEDIMENTO',
        date: data.date + ' 12:00:00.000Z',
        doctor: data.doctor,
        patient: data.patient,
        patient_source: data.patient_source,
        procedures: data.procedures,
        amount: data.amount,
        payment_method: data.payment_method as any,
        card_machine: data.card_machine,
        installments: data.installments,
        card_fee_percent: feeCalc.percent,
        card_fee_amount: feeCalc.amount,
        net_amount: feeCalc.net,
      })
      toast({
        title: 'Lançamento salvo com sucesso ✓',
        className: 'bg-green-600 text-white border-0',
      })
      form.reset({
        date: getLocalDate(),
        doctor: '',
        patient: '',
        patient_source: undefined,
        procedures: [],
        amount: 0,
        payment_method: undefined,
        card_machine: undefined,
        installments: undefined,
      })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const doctorProcedures = allProcedures.filter((p) => p.doctor === doc)
  const groupedProcedures = doctorProcedures.reduce(
    (acc, p) => {
      if (!acc[p.category]) acc[p.category] = []
      acc[p.category].push(p.name)
      return acc
    },
    {} as Record<string, string[]>,
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 animate-fade-in p-4 bg-white/50 rounded-3xl"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">🩺 Consulta / Procedimento</h2>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={form.formState.errors.date ? 'text-destructive' : ''}>Data</Label>
          <Input type="date" {...form.register('date')} className="rounded-xl h-12 bg-white mt-1" />
        </div>
        <div>
          <Label className={form.formState.errors.amount ? 'text-destructive' : ''}>
            Valor Bruto (R$)
          </Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('amount')}
            className="rounded-xl h-12 bg-white mt-1"
          />
        </div>
      </div>

      <div>
        <Label className={form.formState.errors.doctor ? 'text-destructive' : ''}>Médico</Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {['Dr. Maykow', 'Dra. Ana Cláudia'].map((d) => (
            <Button
              key={d}
              type="button"
              variant={doc === d ? 'default' : 'outline'}
              className={`h-12 rounded-xl font-bold ${doc === d ? 'bg-primary text-white shadow-md' : 'bg-white'}`}
              onClick={() => {
                form.setValue('doctor', d, { shouldValidate: true })
                form.setValue('procedures', [])
              }}
            >
              {d}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className={form.formState.errors.patient ? 'text-destructive' : ''}>
            Paciente
          </Label>
          <Input
            {...form.register('patient')}
            placeholder="Nome completo"
            className={`rounded-xl h-12 bg-white mt-1 ${form.formState.errors.patient ? 'border-destructive ring-destructive' : ''}`}
          />
          {form.formState.errors.patient && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.patient.message}</p>
          )}
        </div>
        <div>
          <Label>Origem do Paciente</Label>
          <Select
            onValueChange={(v) => form.setValue('patient_source', v)}
            value={form.watch('patient_source')}
          >
            <SelectTrigger className="bg-white rounded-xl h-12 mt-1">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {[
                'Google',
                'Seguimento',
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
              ].map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {doc && (
        <div>
          <Label className={form.formState.errors.procedures ? 'text-destructive' : ''}>
            Procedimentos
          </Label>
          <div className="space-y-4 mt-2">
            {Object.entries(groupedProcedures).map(([cat, procs]) => (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">{cat}</h4>
                <div className="flex flex-wrap gap-2">
                  {procs.map((p) => {
                    const isSel = form.watch('procedures').includes(p)
                    return (
                      <Button
                        key={p}
                        type="button"
                        variant={isSel ? 'default' : 'outline'}
                        size="sm"
                        className={`rounded-full ${isSel ? 'bg-secondary text-white' : 'bg-white text-xs'}`}
                        onClick={() => {
                          const cur = form.watch('procedures')
                          form.setValue(
                            'procedures',
                            isSel ? cur.filter((x) => x !== p) : [...cur, p],
                            { shouldValidate: true },
                          )
                        }}
                      >
                        {p}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {form.formState.errors.procedures && (
            <p className="text-xs text-destructive mt-1">
              {form.formState.errors.procedures.message}
            </p>
          )}
        </div>
      )}

      <div>
        <Label className={form.formState.errors.payment_method ? 'text-destructive' : ''}>
          Forma de Pagamento
        </Label>
        <div className="grid grid-cols-3 gap-3 mt-1">
          {['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO'].map((pm) => (
            <Button
              key={pm}
              type="button"
              variant={payment === pm ? 'default' : 'outline'}
              className={`h-12 rounded-xl font-bold text-xs ${payment === pm ? 'bg-primary text-white shadow-md' : 'bg-white'}`}
              onClick={() => {
                form.setValue('payment_method', pm as any, { shouldValidate: true })
                if (pm !== 'CARTÃO DE CRÉDITO') {
                  form.setValue('card_machine', undefined)
                  form.setValue('installments', undefined)
                }
              }}
            >
              {pm === 'CARTÃO DE CRÉDITO' ? 'CRÉDITO' : pm}
            </Button>
          ))}
        </div>
      </div>

      {payment === 'CARTÃO DE CRÉDITO' && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
          <div>
            <Label className={form.formState.errors.card_machine ? 'text-destructive' : ''}>
              Maquininha
            </Label>
            <Select
              onValueChange={(v) => form.setValue('card_machine', v, { shouldValidate: true })}
              value={machineId}
            >
              <SelectTrigger className="bg-white rounded-xl h-12 mt-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {machines.map((m) => (
                  <SelectItem key={m.id} value={m.id!}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Parcelas</Label>
            <div className="grid grid-cols-6 gap-2 mt-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <Button
                  key={i + 1}
                  type="button"
                  variant={inst === i + 1 ? 'default' : 'outline'}
                  className={`h-10 rounded-lg text-xs ${inst === i + 1 ? 'bg-secondary text-white' : 'bg-white'}`}
                  onClick={() => form.setValue('installments', i + 1, { shouldValidate: true })}
                >
                  {i + 1}x
                </Button>
              ))}
            </div>
          </div>
          {feeCalc.percent >= 0 && amount > 0 && (
            <div className="flex justify-between items-center text-sm font-semibold p-3 bg-white rounded-xl shadow-sm">
              <span className="text-muted-foreground">
                Taxa: {feeCalc.percent}% ({formatCurrency(feeCalc.amount)})
              </span>
              <span className="text-secondary text-base">
                Líquido: {formatCurrency(feeCalc.net)}
              </span>
            </div>
          )}
          {form.formState.errors.card_machine && (
            <p className="text-xs text-destructive">{form.formState.errors.card_machine.message}</p>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform bg-green-600 hover:bg-green-700 text-white"
      >
        Salvar Nova Entrada
      </Button>
    </form>
  )
}
