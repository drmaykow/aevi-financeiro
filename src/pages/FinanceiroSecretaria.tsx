import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { LogOut, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getRecentTransactions,
  deleteTransaction,
  TransactionRecord,
} from '@/services/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ConsultaForm } from '@/components/financeiro/ConsultaForm'
import { TaxaForm } from '@/components/financeiro/TaxaForm'
import { NovaSaidaForm } from '@/components/financeiro/NovaSaidaForm'
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

export default function FinanceiroSecretaria() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<'home' | 'nova-entrada' | 'nova-saida' | 'consulta' | 'taxa'>(
    'home',
  )
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  const loadData = async () => {
    try {
      const res = await getRecentTransactions()
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

  const renderView = () => {
    if (view === 'consulta')
      return (
        <ConsultaForm onSuccess={() => setView('home')} onCancel={() => setView('nova-entrada')} />
      )
    if (view === 'taxa')
      return <TaxaForm onSuccess={() => setView('home')} onCancel={() => setView('nova-entrada')} />
    if (view === 'nova-saida')
      return <NovaSaidaForm onSuccess={() => setView('home')} onCancel={() => setView('home')} />
    if (view === 'nova-entrada') {
      return (
        <div className="space-y-4 animate-fade-in max-w-lg mx-auto p-4 bg-white/50 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Nova Entrada</h2>
            <Button variant="ghost" onClick={() => setView('home')}>
              Cancelar
            </Button>
          </div>
          <Button
            onClick={() => setView('consulta')}
            className="w-full h-20 text-lg rounded-2xl bg-white text-foreground hover:bg-white shadow-sm border border-border"
          >
            🩺 CONSULTA / PROCEDIMENTO
          </Button>
          <Button
            onClick={() => setView('taxa')}
            className="w-full h-20 text-lg rounded-2xl bg-white text-foreground hover:bg-white shadow-sm border border-border"
          >
            📅 TAXA DE AGENDAMENTO
          </Button>
        </div>
      )
    }

    return (
      <div className="max-w-lg mx-auto mt-4 space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setView('nova-entrada')}
            className="h-32 text-xl font-bold rounded-3xl bg-green-600 text-white shadow-lg hover:bg-green-700 hover:scale-[1.02] flex flex-col gap-2"
          >
            <span className="text-3xl">+</span> NOVA ENTRADA
          </Button>
          <Button
            onClick={() => setView('nova-saida')}
            className="h-32 text-xl font-bold rounded-3xl bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-[1.02] flex flex-col gap-2"
          >
            <span className="text-3xl">-</span> NOVA SAÍDA
          </Button>
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-elevation">
          <h3 className="text-lg font-bold mb-4 text-foreground">Últimos Lançamentos</h3>
          {transactions.filter(
            (tx) =>
              tx.type === 'entry' || (tx.type === 'exit' && tx.category === 'ESTORNO DE TAXA'),
          ).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum lançamento encontrado.</p>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter(
                  (tx) =>
                    tx.type === 'entry' ||
                    (tx.type === 'exit' && tx.category === 'ESTORNO DE TAXA'),
                )
                .slice(0, 20)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-white rounded-2xl shadow-sm border border-border/50"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-sm truncate">
                        {tx.type === 'entry'
                          ? tx.entry_type || tx.doctor
                          : tx.category === 'ESTORNO DE TAXA'
                            ? '↩️ Estorno de Taxa'
                            : tx.category}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {tx.patient || tx.description}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground/70 whitespace-nowrap ml-2">
                          {formatDate(tx.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <span
                        className={`font-bold ${tx.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'entry' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
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
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que quer apagar este lançamento?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => tx.id && deleteTransaction(tx.id).then(loadData)}
                              className="bg-destructive text-white rounded-full hover:bg-destructive/90"
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Aevi Financeiro</h1>
            <p className="text-muted-foreground mt-1">Gestão Diária de Caixa</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="gap-2 rounded-full border-border"
          >
            <LogOut size={16} /> Sair
          </Button>
        </header>
        {renderView()}
      </div>
    </div>
  )
}
