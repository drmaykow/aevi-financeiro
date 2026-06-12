import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { UnifiedExpenseForm } from '@/components/financeiro/UnifiedExpenseForm'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTransactions, TransactionRecord } from '@/services/transactions'
import { useRealtime } from '@/hooks/use-realtime'

export default function Saidas() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  const loadData = async () => {
    try {
      const res = await getTransactions()
      setTransactions(res)
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

  const expenses = transactions.filter(
    (t) =>
      t.type === 'exit' &&
      ((t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar despesas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-card border-none shadow-sm focus-visible:ring-primary h-10"
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-elevation hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-white h-10 px-6">
              <Plus className="mr-2" size={18} /> Nova Despesa
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-primary text-2xl font-bold tracking-tight">
                Registrar Despesa
              </SheetTitle>
            </SheetHeader>
            <UnifiedExpenseForm
              onSuccess={() => {
                setOpen(false)
                loadData()
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      <Card className="rounded-2xl border-none shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Nenhuma despesa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/50 border-border/50 transition-colors"
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{tx.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-red-600 border-red-200 bg-red-50 font-medium"
                      >
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-500">
                      - {formatCurrency(Math.abs(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
