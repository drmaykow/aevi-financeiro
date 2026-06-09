import { useState } from 'react'
import useMainStore from '@/stores/main'
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
import IncomeForm from '@/components/forms/IncomeForm'
import { Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Entradas() {
  const { transactions } = useMainStore()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const incomes = transactions.filter(
    (t) =>
      t.type === 'INCOME' &&
      (t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.patientName?.toLowerCase().includes(search.toLowerCase())),
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
            placeholder="Buscar entradas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-card border-none shadow-sm focus-visible:ring-secondary h-10"
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-elevation hover:scale-105 transition-transform bg-secondary hover:bg-secondary/90 text-white h-10 px-6">
              <Plus className="mr-2" size={18} />
              Nova Entrada
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-6">
            <SheetHeader>
              <SheetTitle className="text-secondary text-2xl font-bold tracking-tight">
                Registrar Entrada
              </SheetTitle>
            </SheetHeader>
            <IncomeForm onSuccess={() => setOpen(false)} />
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
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhuma entrada encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map((tx) => (
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
                        className="text-secondary border-secondary/20 bg-secondary/5 font-medium"
                      >
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.patientName || '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-secondary">
                      {formatCurrency(tx.amount)}
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
