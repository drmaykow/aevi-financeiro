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
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

const expenseSchema = z
  .object({
    category: z.enum([
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
    ]),
    description: z.string().min(1, 'Descrição é obrigatória'),
    amount: z.coerce.number().positive('Valor deve ser maior que zero'),
    date: z.string().min(1, 'Data é obrigatória'),
    is_recurring: z.boolean().optional(),
    doctor: z.string().optional(),
    patient: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.category === 'ESTORNO DE TAXA' && !data.doctor) return false
      return true
    },
    { message: 'Médico é obrigatório para estorno', path: ['doctor'] },
  )
  .refine(
    (data) => {
      if (data.category === 'ESTORNO DE TAXA' && !data.patient) return false
      return true
    },
    { message: 'Paciente é obrigatório para estorno', path: ['patient'] },
  )

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function UnifiedExpenseForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel?: () => void
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

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

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'OUTRO',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      doctor: '',
      patient: '',
    },
  })

  const onSubmit = async (data: ExpenseFormValues) => {
    setLoading(true)
    try {
      await createTransaction({
        ...data,
        type: 'exit',
        date: data.date + ' 12:00:00.000Z',
        is_recurring: data.is_recurring,
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
                  {allowedCategories.includes('ALUGUEL') && (
                    <SelectItem value="ALUGUEL">Aluguel</SelectItem>
                  )}
                  {allowedCategories.includes('LUZ') && <SelectItem value="LUZ">Luz</SelectItem>}
                  {allowedCategories.includes('INTERNET') && (
                    <SelectItem value="INTERNET">Internet</SelectItem>
                  )}
                  {allowedCategories.includes('MARKETING') && (
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                  )}
                  {allowedCategories.includes('CONDOMINIO') && (
                    <SelectItem value="CONDOMINIO">Condomínio</SelectItem>
                  )}
                  {allowedCategories.includes('MATERIAL E INSUMO') && (
                    <SelectItem value="MATERIAL E INSUMO">Material e Insumo</SelectItem>
                  )}
                  {allowedCategories.includes('CONTADOR') && (
                    <SelectItem value="CONTADOR">Contador</SelectItem>
                  )}
                  {allowedCategories.includes('IMPOSTOS/TAXAS') && (
                    <SelectItem value="IMPOSTOS/TAXAS">Impostos/Taxas</SelectItem>
                  )}
                  {allowedCategories.includes('SECRETARIA') && (
                    <SelectItem value="SECRETARIA">Secretária</SelectItem>
                  )}
                  {allowedCategories.includes('OUTRO') && (
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  )}
                  {allowedCategories.includes('ESTORNO DE TAXA') && (
                    <SelectItem value="ESTORNO DE TAXA">Estorno de Taxa</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('category') === 'ESTORNO DE TAXA' && (
          <div className="grid grid-cols-2 gap-4">
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
                      <SelectTrigger className="bg-muted/50 border-transparent focus:ring-primary">
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
            <FormField
              control={form.control}
              name="patient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do paciente"
                      className="bg-muted/50 border-transparent focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    form.watch('category') === 'ESTORNO DE TAXA'
                      ? 'Motivo do estorno...'
                      : 'Descreva a despesa'
                  }
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

        <div className="flex items-center gap-2 mt-4 p-4 border rounded-xl bg-white/80">
          <input
            type="checkbox"
            id="is_recurring_unified"
            {...form.register('is_recurring')}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="is_recurring_unified" className="font-semibold cursor-pointer text-sm">
            Conta Fixa (Repetir para o próximo mês)
          </Label>
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
