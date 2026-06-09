import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, MinusCircle, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getDailyTransactions,
  createTransaction,
  deleteTransaction,
  TransactionRecord,
} from '@/services/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatCurrency } from '@/lib/utils'

const entrySchema = z.object({
  date: z.string().min(1, 'Preencha este campo'),
  doctor: z.string().min(1, 'Preencha este campo'),
  amount: z.coerce.number().positive('Preencha este campo'),
  payment_method: z.enum(['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO'], {
    required_error: 'Preencha este campo',
  }),
  description: z.string().optional(),
})

const exitSchema = z
  .object({
    date: z.string().min(1, 'Preencha este campo'),
    category: z.enum(['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO'], {
      required_error: 'Preencha este campo',
    }),
    amount: z.coerce.number().positive('Preencha este campo'),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.category === 'OUTRO' && (!data.description || data.description.trim() === '')) {
        return false
      }
      return true
    },
    {
      message: 'Preencha este campo',
      path: ['description'],
    },
  )

const EntryForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      doctor: '',
      amount: 0,
      payment_method: undefined,
      description: '',
    },
  })

  const { toast } = useToast()

  const onSubmit = async (data: z.infer<typeof entrySchema>) => {
    try {
      await createTransaction({
        type: 'entry',
        date: data.date + ' 12:00:00.000Z',
        doctor: data.doctor,
        amount: data.amount,
        payment_method: data.payment_method as any,
        description: data.description || '',
      })
      toast({
        title: 'Lançamento salvo com sucesso ✓',
        className: 'bg-green-600 text-white border-0',
      })
      form.reset({
        date: new Date().toISOString().split('T')[0],
        doctor: '',
        amount: 0,
        payment_method: undefined,
        description: '',
      })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={form.formState.errors.date ? 'text-red-500' : ''}>Data</Label>
          <Input
            type="date"
            {...form.register('date')}
            className={form.formState.errors.date ? 'border-red-500' : ''}
          />
          {form.formState.errors.date && (
            <p className="text-xs text-red-500">{form.formState.errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className={form.formState.errors.doctor ? 'text-red-500' : ''}>
            Médico Responsável
          </Label>
          <Select
            onValueChange={(v) => form.setValue('doctor', v, { shouldValidate: true })}
            value={form.watch('doctor') || ''}
          >
            <SelectTrigger className={form.formState.errors.doctor ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dr. Maykow">Dr. Maykow</SelectItem>
              <SelectItem value="Dra. Ana Cláudia">Dra. Ana Cláudia</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.doctor && (
            <p className="text-xs text-red-500">{form.formState.errors.doctor.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className={form.formState.errors.amount ? 'text-red-500' : ''}>Valor (R$)</Label>
        <Input
          type="number"
          step="0.01"
          {...form.register('amount')}
          className={form.formState.errors.amount ? 'border-red-500' : ''}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className={form.formState.errors.payment_method ? 'text-red-500' : ''}>
          Forma de Pagamento
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO'].map((method) => (
            <Button
              key={method}
              type="button"
              variant={form.watch('payment_method') === method ? 'default' : 'outline'}
              className={`h-16 text-sm font-bold transition-all ${form.formState.errors.payment_method && !form.watch('payment_method') ? 'border-red-500' : ''} ${form.watch('payment_method') === method ? 'bg-primary text-white scale-[1.02] shadow-md' : 'hover:border-primary/50 text-foreground/70'}`}
              onClick={() =>
                form.setValue('payment_method', method as any, { shouldValidate: true })
              }
            >
              {method}
            </Button>
          ))}
        </div>
        {form.formState.errors.payment_method && (
          <p className="text-xs text-red-500">{form.formState.errors.payment_method.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Observações (Opcional)</Label>
        <Input {...form.register('description')} placeholder="Detalhes adicionais..." />
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform"
      >
        Salvar Nova Entrada
      </Button>
    </form>
  )
}

const ExitForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const form = useForm<z.infer<typeof exitSchema>>({
    resolver: zodResolver(exitSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: undefined,
      amount: 0,
      description: '',
    },
  })

  const { toast } = useToast()

  const onSubmit = async (data: z.infer<typeof exitSchema>) => {
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
      form.reset({
        date: new Date().toISOString().split('T')[0],
        category: undefined,
        amount: 0,
        description: '',
      })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={form.formState.errors.date ? 'text-red-500' : ''}>Data</Label>
          <Input
            type="date"
            {...form.register('date')}
            className={form.formState.errors.date ? 'border-red-500' : ''}
          />
          {form.formState.errors.date && (
            <p className="text-xs text-red-500">{form.formState.errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className={form.formState.errors.amount ? 'text-red-500' : ''}>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('amount')}
            className={form.formState.errors.amount ? 'border-red-500' : ''}
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className={form.formState.errors.category ? 'text-red-500' : ''}>Categoria</Label>
        <div className="grid grid-cols-2 gap-3">
          {['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO'].map((cat) => (
            <Button
              key={cat}
              type="button"
              variant={form.watch('category') === cat ? 'default' : 'outline'}
              className={`h-14 text-sm font-bold transition-all ${form.formState.errors.category && !form.watch('category') ? 'border-red-500' : ''} ${form.watch('category') === cat ? 'bg-secondary text-white scale-[1.02] shadow-md' : 'hover:border-secondary/50 text-foreground/70'}`}
              onClick={() => form.setValue('category', cat as any, { shouldValidate: true })}
            >
              {cat}
            </Button>
          ))}
        </div>
        {form.formState.errors.category && (
          <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className={form.formState.errors.description ? 'text-red-500' : ''}>
          Descrição {form.watch('category') === 'OUTRO' && '*'}
        </Label>
        <Input
          {...form.register('description')}
          placeholder="Detalhes da despesa..."
          className={form.formState.errors.description ? 'border-red-500' : ''}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform bg-secondary hover:bg-secondary/90"
      >
        Salvar Nova Saída
      </Button>
    </form>
  )
}

export default function FinanceiroSecretaria() {
  const [tab, setTab] = useState<'entry' | 'exit'>('entry')
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      const res = await getDailyTransactions()
      setTransactions(res.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('transactions', () => {
    loadData()
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão Financeira</h1>
            <p className="text-muted-foreground mt-1">Controle diário de caixa da clínica</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="gap-2 rounded-full"
          >
            <LogOut size={16} /> Sair
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-elevation border-0 bg-white/60 backdrop-blur-xl h-fit">
            <CardHeader className="pb-4">
              <div className="flex gap-4">
                <Button
                  variant={tab === 'entry' ? 'default' : 'outline'}
                  onClick={() => setTab('entry')}
                  className={`flex-1 h-14 text-sm font-semibold rounded-full gap-2 transition-all ${tab === 'entry' ? 'bg-primary text-white shadow-md' : 'text-foreground/60 hover:text-primary border-primary/20'}`}
                >
                  <PlusCircle size={18} /> + Nova Entrada
                </Button>
                <Button
                  variant={tab === 'exit' ? 'default' : 'outline'}
                  onClick={() => setTab('exit')}
                  className={`flex-1 h-14 text-sm font-semibold rounded-full gap-2 transition-all ${tab === 'exit' ? 'bg-secondary text-white shadow-md' : 'text-foreground/60 hover:text-secondary border-secondary/20'}`}
                >
                  <MinusCircle size={18} /> + Nova Saída
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tab === 'entry' ? (
                <EntryForm onSuccess={loadData} />
              ) : (
                <ExitForm onSuccess={loadData} />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elevation border-0 bg-white/60 backdrop-blur-xl h-fit">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">Lançamentos de Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lançamento registrado hoje.
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${tx.type === 'entry' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}
                        >
                          {tx.type === 'entry' ? (
                            <PlusCircle size={20} />
                          ) : (
                            <MinusCircle size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground line-clamp-1">
                            {tx.type === 'entry' ? tx.doctor : tx.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tx.description || (tx.type === 'entry' ? tx.payment_method : '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`font-bold ${tx.type === 'entry' ? 'text-primary' : 'text-secondary'}`}
                        >
                          {tx.type === 'entry' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que quer apagar este lançamento?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  if (tx.id) {
                                    await deleteTransaction(tx.id)
                                    loadData()
                                  }
                                }}
                                className="bg-destructive text-white hover:bg-destructive/90 rounded-full"
                              >
                                Apagar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
