import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

const expenseSchema = z.object({
  category: z.enum(['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function UnifiedExpenseForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel?: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'OUTRO',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true)
    try {
      await createTransaction({
        ...data,
        type: 'exit',
        date: new Date(data.date).toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Saída registrada com sucesso!' })
      form.reset()
      onSuccess()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a saída.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/50 border-transparent focus:ring-primary">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ALUGUEL">Aluguel</SelectItem>
                  <SelectItem value="CONTA FIXA">Conta Fixa</SelectItem>
                  <SelectItem value="MATERIAL E INSUMO">Material e Insumo</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descreva a despesa"
                  className="bg-muted/50 border-transparent focus-visible:ring-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="bg-muted/50 border-transparent focus-visible:ring-primary"
                    {...field}
                  />
                </FormControl>
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
                    className="bg-muted/50 border-transparent focus-visible:ring-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-md text-white"
          >
            {loading ? 'Salvando...' : 'Salvar Saída'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
