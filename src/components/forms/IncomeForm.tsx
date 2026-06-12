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

const incomeSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  patientName: z.string().optional(),
})

type IncomeFormValues = z.infer<typeof incomeSchema>

export default function IncomeForm({ onSuccess }: { onSuccess: () => void }) {
  const { addTransaction } = useMainStore()
  const { toast } = useToast()

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: getLocalDate(),
      category: '',
      patientName: '',
    },
  })

  const onSubmit = (data: IncomeFormValues) => {
    addTransaction({
      ...data,
      type: 'INCOME',
      date: data.date + ' 12:00:00.000Z',
    })
    toast({ title: 'Sucesso', description: 'Lançamento registrado com sucesso' })
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
                  placeholder="Ex: Consulta Dr. Maykow"
                  className="bg-muted/50 border-transparent focus-visible:ring-secondary"
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
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
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
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
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
                  <SelectTrigger className="bg-muted/50 border-transparent focus:ring-secondary">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Consulta">Consulta</SelectItem>
                  <SelectItem value="Procedimento">Procedimento</SelectItem>
                  <SelectItem value="Exame">Exame</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="patientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do paciente"
                  className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full rounded-full bg-secondary hover:bg-secondary/90 shadow-md"
        >
          Salvar Lançamento
        </Button>
      </form>
    </Form>
  )
}
