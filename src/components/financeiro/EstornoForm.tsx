import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransaction } from '@/services/transactions'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  date: z.string().min(1, 'Preencha este campo'),
  doctor: z.string().min(1, 'Preencha este campo'),
  patient: z.string().min(1, 'Informe o nome da paciente'),
  amount: z.coerce.number().min(1, 'Preencha este campo'),
  description: z.string().min(1, 'Preencha este campo'),
})

export function EstornoForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      doctor: '',
      patient: '',
      amount: 0,
      description: '',
    },
  })

  const doc = form.watch('doctor')
  const amount = form.watch('amount')
  const desc = form.watch('description')

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createTransaction({
        type: 'exit',
        entry_type: 'ESTORNO DE TAXA',
        category: 'ESTORNO DE TAXA' as any,
        date: data.date + ' 12:00:00.000Z',
        doctor: data.doctor,
        patient: data.patient,
        amount: data.amount,
        description: data.description,
      })
      toast({
        title: 'Lançamento salvo com sucesso ✓',
        className: 'bg-green-600 text-white border-0',
      })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 animate-fade-in p-4 bg-white/50 rounded-3xl"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">↩️ Estorno de Taxa</h2>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div>
        <Label>Data</Label>
        <Input type="date" {...form.register('date')} className="rounded-xl h-12 bg-white mt-1" />
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
              onClick={() => form.setValue('doctor', d)}
            >
              {d}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className={form.formState.errors.patient ? 'text-destructive' : ''}>Paciente</Label>
        <Input
          {...form.register('patient')}
          placeholder="Nome completo"
          className="rounded-xl h-12 bg-white mt-1"
        />
        {form.formState.errors.patient && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.patient.message}</p>
        )}
      </div>

      <div>
        <Label className={form.formState.errors.amount ? 'text-destructive' : ''}>
          Valor do Estorno
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {[100, 200].map((v) => (
            <Button
              key={v}
              type="button"
              variant={amount === v ? 'default' : 'outline'}
              className={`h-12 rounded-xl font-bold ${amount === v ? 'bg-destructive text-white shadow-md' : 'bg-white'}`}
              onClick={() => form.setValue('amount', v)}
            >
              R$ {v}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className={form.formState.errors.description ? 'text-destructive' : ''}>
          Motivo
        </Label>
        <div className="grid grid-cols-1 gap-2 mt-1">
          {['CANCELAMENTO COM ANTECEDÊNCIA', 'OUTRO'].map((m) => (
            <Button
              key={m}
              type="button"
              variant={desc === m ? 'default' : 'outline'}
              className={`h-12 rounded-xl font-bold text-xs ${desc === m ? 'bg-secondary text-white shadow-md' : 'bg-white'}`}
              onClick={() => form.setValue('description', m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform"
      >
        Salvar Estorno
      </Button>
    </form>
  )
}
