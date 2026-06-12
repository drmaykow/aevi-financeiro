import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useMainStore from '@/stores/main'
import { useToast } from '@/hooks/use-toast'

const getLocalDate = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const expenseSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  status: z.enum(['PAID', 'PENDING']),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const { addTransaction } = useMainStore()
  const { toast } = useToast()

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: getLocalDate(),
      category: '',
      status: 'PAID',
    },
  })

  const onSubmit = (data: ExpenseFormValues) => {
    addTransaction({
      ...data,
      type: 'EXPENSE',
      date: data.date + ' 12:00:00.000Z',
    })
    toast({ title: 'Sucesso', description: 'Despesa registrada com sucesso' })
    form.reset()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Compra de seringas"
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
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/50 border-transparent focus:ring-primary">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Aluguel">Aluguel</SelectItem>
                  <SelectItem value="Suprimentos">Suprimentos</SelectItem>
                  <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/50 border-transparent focus:ring-primary">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full rounded-full bg-primary hover:bg-primary/90 shadow-md"
        >
          Salvar Despesa
        </Button>
      </form>
    </Form>
  )
}
