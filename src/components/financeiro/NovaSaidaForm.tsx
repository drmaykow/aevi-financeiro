import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransaction } from '@/services/transactions'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

const schema = z
  .object({
    date: z.string().min(1, 'Preencha este campo'),
    category: z.enum(
      [
        'ALUGUEL',
        'LUZ',
        'INTERNET',
        'MARKETING',
        'CONDOMINIO',
        'MATERIAL E INSUMO',
        'CONTADOR',
        'IMPOSTOS/TAXAS',
        'SECRETARIA',
        'ESTORNO DE TAXA',
        'OUTRO',
      ],
      { required_error: 'Preencha este campo' },
    ),
    amount: z.coerce.number().min(0.01, 'Preencha este campo'),
    description: z.string().optional(),
    doctor: z.string().optional(),
    patient: z.string().optional(),
    is_recurring: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.category === 'OUTRO' && (!data.description || data.description.trim() === ''))
        return false
      return true
    },
    { message: 'Preencha este campo', path: ['description'] },
  )
  .refine(
    (data) => {
      if (data.category === 'ESTORNO DE TAXA' && !data.doctor) return false
      return true
    },
    { message: 'Preencha este campo', path: ['doctor'] },
  )
  .refine(
    (data) => {
      if (data.category === 'ESTORNO DE TAXA' && !data.patient) return false
      return true
    },
    { message: 'Informe o nome da paciente', path: ['patient'] },
  )
  .refine(
    (data) => {
      if (
        data.category === 'ESTORNO DE TAXA' &&
        (!data.description || data.description.trim() === '')
      )
        return false
      return true
    },
    { message: 'Selecione o motivo', path: ['description'] },
  )

const getLocalDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function NovaSaidaForm({
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
      date: getLocalDate(),
      category: undefined,
      amount: 0,
      description: '',
      doctor: '',
      patient: '',
      is_recurring: false,
    },
  })

  const cat = form.watch('category')
  const doc = form.watch('doctor')
  const amount = form.watch('amount')
  const desc = form.watch('description')

  const { user } = useAuth()
  const allowedCategories =
    user?.role === 'secretaria'
      ? ['ESTORNO DE TAXA', 'OUTRO']
      : [
          'ALUGUEL',
          'LUZ',
          'INTERNET',
          'MARKETING',
          'CONDOMINIO',
          'MATERIAL E INSUMO',
          'CONTADOR',
          'IMPOSTOS/TAXAS',
          'SECRETARIA',
          'ESTORNO DE TAXA',
          'OUTRO',
        ]

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createTransaction({
        type: 'exit',
        date: data.date + ' 12:00:00.000Z',
        category: data.category as any,
        amount: data.amount,
        description: data.description || '',
        doctor: data.doctor,
        patient: data.patient,
        is_recurring: data.is_recurring,
      })
      toast({
        title: 'Lançamento salvo com sucesso ✓',
        className: 'bg-green-600 text-white border-0',
      })
      form.reset({
        date: getLocalDate(),
        category: undefined,
        amount: 0,
        description: '',
        doctor: '',
        patient: '',
        is_recurring: false,
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
        <h2 className="text-xl font-bold text-foreground">Nova Saída</h2>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data</Label>
          <Input type="date" {...form.register('date')} className="rounded-xl h-12 bg-white mt-1" />
        </div>
        {cat !== 'ESTORNO DE TAXA' && (
          <div>
            <Label className={form.formState.errors.amount ? 'text-destructive' : ''}>
              Valor (R$)
            </Label>
            <Input
              type="number"
              step="0.01"
              {...form.register('amount')}
              className="rounded-xl h-12 bg-white mt-1"
            />
          </div>
        )}
      </div>

      <div>
        <Label className={form.formState.errors.category ? 'text-destructive' : ''}>
          Categoria
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {allowedCategories.map((c) => (
            <Button
              key={c}
              type="button"
              variant={cat === c ? 'default' : 'outline'}
              className={`h-14 rounded-xl font-bold text-xs ${cat === c ? (c === 'ESTORNO DE TAXA' ? 'bg-destructive' : 'bg-secondary') + ' text-white shadow-md' : 'bg-white'}`}
              onClick={() => {
                form.setValue('category', c as any, { shouldValidate: true })
                if (c !== 'ESTORNO DE TAXA') {
                  form.setValue('doctor', '')
                  form.setValue('patient', '')
                  form.setValue('description', '')
                }
              }}
            >
              {c === 'ESTORNO DE TAXA' ? '↩️ ' + c : c}
            </Button>
          ))}
        </div>
        {form.formState.errors.category && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>

      {cat === 'ESTORNO DE TAXA' ? (
        <div className="space-y-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
          <div>
            <Label className={form.formState.errors.doctor ? 'text-destructive' : ''}>Médico</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {['Dr. Maykow', 'Dra. Ana Cláudia'].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={doc === d ? 'default' : 'outline'}
                  className={`h-12 rounded-xl font-bold ${doc === d ? 'bg-primary text-white shadow-md' : 'bg-white'}`}
                  onClick={() => form.setValue('doctor', d, { shouldValidate: true })}
                >
                  {d}
                </Button>
              ))}
            </div>
            {form.formState.errors.doctor && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.doctor.message}
              </p>
            )}
          </div>
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
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.patient.message}
              </p>
            )}
          </div>
          <div>
            <Label className={form.formState.errors.amount ? 'text-destructive' : ''}>
              Valor do Estorno
            </Label>
            <div className="flex gap-3 mt-1 items-center">
              {[100, 200].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={amount === v ? 'default' : 'outline'}
                  className={`h-12 flex-1 rounded-xl font-bold ${amount === v ? 'bg-destructive text-white shadow-md' : 'bg-white'}`}
                  onClick={() => form.setValue('amount', v, { shouldValidate: true })}
                >
                  R$ {v}
                </Button>
              ))}
              <Input
                type="number"
                step="0.01"
                placeholder="Outro valor"
                value={amount || ''}
                onChange={(e) =>
                  form.setValue('amount', Number(e.target.value), { shouldValidate: true })
                }
                className="rounded-xl h-12 flex-1 bg-white"
              />
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
                  onClick={() => form.setValue('description', m, { shouldValidate: true })}
                >
                  {m}
                </Button>
              ))}
            </div>
            {form.formState.errors.description && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Label className={form.formState.errors.description ? 'text-destructive' : ''}>
            Descrição {cat === 'OUTRO' && '*'}
          </Label>
          <Input
            {...form.register('description')}
            placeholder="Detalhes da despesa..."
            className={`rounded-xl h-12 bg-white mt-1 ${form.formState.errors.description ? 'border-destructive ring-destructive' : ''}`}
          />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 p-4 border rounded-xl bg-white/80">
        <input
          type="checkbox"
          id="is_recurring"
          {...form.register('is_recurring')}
          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="is_recurring" className="font-semibold cursor-pointer text-sm">
          Conta Fixa (Repetir para o próximo mês)
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform bg-red-600 hover:bg-red-700 text-white"
      >
        Salvar Nova Saída
      </Button>
    </form>
  )
}
