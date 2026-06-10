import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTransaction } from '@/services/transactions'
import { useToast } from '@/hooks/use-toast'

const schema = z
  .object({
    date: z.string().min(1, 'Preencha este campo'),
    category: z.enum(['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO'], {
      required_error: 'Preencha este campo',
    }),
    amount: z.coerce.number().min(0.01, 'Preencha este campo'),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.category === 'OUTRO' && (!data.description || data.description.trim() === ''))
        return false
      return true
    },
    { message: 'Preencha este campo', path: ['description'] },
  )

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
      date: new Date().toISOString().split('T')[0],
      category: undefined,
      amount: 0,
      description: '',
    },
  })

  const cat = form.watch('category')

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await createTransaction({
        type: 'exit',
        date: data.date + ' 12:00:00.000Z',
        category: data.category as any,
        amount: data.amount,
        description: data.description || '',
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
      </div>

      <div>
        <Label className={form.formState.errors.category ? 'text-destructive' : ''}>
          Categoria
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          {['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO'].map((c) => (
            <Button
              key={c}
              type="button"
              variant={cat === c ? 'default' : 'outline'}
              className={`h-14 rounded-xl font-bold text-xs ${cat === c ? 'bg-secondary text-white shadow-md' : 'bg-white'}`}
              onClick={() => form.setValue('category', c as any)}
            >
              {c}
            </Button>
          ))}
        </div>
        {form.formState.errors.category && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div>
        <Label className={form.formState.errors.description ? 'text-destructive' : ''}>
          Descrição {cat === 'OUTRO' && '*'}
        </Label>
        <Input
          {...form.register('description')}
          placeholder="Detalhes da despesa..."
          className="rounded-xl h-12 bg-white mt-1"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform"
      >
        Salvar Nova Saída
      </Button>
    </form>
  )
}
