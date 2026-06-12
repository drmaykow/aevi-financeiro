import { useState, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getProcedures, getCardMachines, Procedure, CardMachine } from '@/services/settings'
import { createTransaction } from '@/services/transactions'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

const getLocalDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const entrySchema = z.object({
  entry_type: z.enum(['CONSULTA/PROCEDIMENTO', 'TAXA DE AGENDAMENTO']),
  doctor: z.string().min(1, 'Médico é obrigatório'),
  patient: z.string().min(1, 'Paciente é obrigatório'),
  procedures: z.string().optional(),
  payment_method: z.enum(['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO']),
  card_machine: z.string().optional(),
  installments: z.coerce.number().min(1).max(12).optional(),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type EntryFormValues = z.infer<typeof entrySchema>

export function UnifiedEntryForm({
  defaultEntryType,
  onSuccess,
  onCancel,
}: {
  defaultEntryType?: string
  onSuccess: () => void
  onCancel?: () => void
}) {
  const { toast } = useToast()
  const [machines, setMachines] = useState<CardMachine[]>([])
  const [proceduresList, setProceduresList] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getCardMachines(), getProcedures()]).then(([m, p]) => {
      setMachines(m)
      setProceduresList(p)
    })
  }, [])

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entry_type: (defaultEntryType as any) || 'CONSULTA/PROCEDIMENTO',
      doctor: '',
      patient: '',
      procedures: '',
      payment_method: 'PIX',
      card_machine: '',
      installments: 1,
      amount: 0,
      date: getLocalDate(),
    },
  })

  const watchPaymentMethod = form.watch('payment_method')
  const watchMachine = form.watch('card_machine')
  const watchInstallments = form.watch('installments')
  const watchAmount = form.watch('amount')
  const watchDoctor = form.watch('doctor')

  const calculations = useMemo(() => {
    let feePercent = 0
    let feeAmount = 0
    const amount = Number(watchAmount) || 0
    let netAmount = amount

    if (watchPaymentMethod === 'CARTÃO DE CRÉDITO' && watchMachine && watchInstallments) {
      const machine = machines.find((m) => m.id === watchMachine)
      if (machine && machine.fees && machine.fees[watchInstallments]) {
        feePercent = Number(machine.fees[watchInstallments]) || 0
        feeAmount = (amount * feePercent) / 100
        netAmount = amount - feeAmount
      }
    }
    return { feePercent, feeAmount, netAmount }
  }, [watchPaymentMethod, watchMachine, watchInstallments, watchAmount, machines])

  const onSubmit = async (data: EntryFormValues) => {
    setLoading(true)
    try {
      await createTransaction({
        ...data,
        type: 'entry',
        date: data.date + ' 12:00:00.000Z',
        procedures: data.procedures ? [data.procedures] : [],
        card_fee_percent: calculations.feePercent,
        card_fee_amount: calculations.feeAmount,
        net_amount: calculations.netAmount,
      })
      toast({ title: 'Sucesso', description: 'Entrada registrada com sucesso!' })
      form.reset()
      onSuccess()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a entrada.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProcedures = proceduresList.filter((p) => !watchDoctor || p.doctor === watchDoctor)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entry_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Entrada</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-muted/50 border-transparent focus:ring-secondary">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CONSULTA/PROCEDIMENTO">Consulta / Procedimento</SelectItem>
                    <SelectItem value="TAXA DE AGENDAMENTO">Taxa de Agendamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="doctor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Médico</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-muted/50 border-transparent focus:ring-secondary">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Dr. Maykow">Dr. Maykow</SelectItem>
                    <SelectItem value="Dra. Ana Cláudia">Dra. Ana Cláudia</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="patient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo do paciente"
                  className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('entry_type') === 'CONSULTA/PROCEDIMENTO' && (
          <FormField
            control={form.control}
            name="procedures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procedimento / Consulta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-muted/50 border-transparent focus:ring-secondary">
                      <SelectValue placeholder="Selecione o procedimento..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredProcedures.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pagamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-muted/50 border-transparent focus:ring-secondary">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                    <SelectItem value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {watchPaymentMethod === 'CARTÃO DE CRÉDITO' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
            <FormField
              control={form.control}
              name="card_machine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maquininha</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-transparent focus:ring-secondary">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machines.map((m) => (
                        <SelectItem key={m.id} value={m.id!}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white border-transparent focus:ring-secondary">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Bruto (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Valor Líquido (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                value={(Number(calculations.netAmount) || 0).toFixed(2)}
                disabled
                className="bg-secondary/10 border-transparent text-secondary font-bold"
              />
            </FormControl>
          </FormItem>
        </div>

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full rounded-full"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-secondary hover:bg-secondary/90 shadow-md"
          >
            {loading ? 'Salvando...' : 'Salvar Entrada'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
