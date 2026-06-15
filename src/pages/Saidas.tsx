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
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { UnifiedExpenseForm } from '@/components/financeiro/UnifiedExpenseForm'
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTransactions, TransactionRecord, deleteTransaction } from '@/services/transactions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditTransactionModal } from '@/components/financeiro/EditTransactionModal'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

export default function Saidas() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'desc' | 'asc' | null }>({
    key: '',
    direction: null,
  })
  const [editingTx, setEditingTx] = useState<TransactionRecord | null>(null)
  const [deletingTx, setDeletingTx] = useState<TransactionRecord | null>(null)

  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null)
  const [isBulkDialogOp, setIsBulkDialogOp] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

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

  const handleSort = (key: string) => {
    let direction: 'desc' | 'asc' | null = 'desc'
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') direction = 'asc'
      else if (sortConfig.direction === 'asc') direction = null
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({
    title,
    sortKey,
    alignRight,
  }: {
    title: string
    sortKey: string
    alignRight?: boolean
  }) => {
    const isActive = sortConfig.key === sortKey && sortConfig.direction !== null
    const Icon = !isActive
      ? ChevronsUpDown
      : sortConfig.direction === 'desc'
        ? ChevronDown
        : ChevronUp

    return (
      <TableHead
        className={cn(
          'cursor-pointer select-none transition-colors hover:bg-muted/50',
          isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 font-medium',
          alignRight && 'text-right',
        )}
        onClick={() => handleSort(sortKey)}
      >
        <div className={cn('flex items-center gap-1', alignRight && 'justify-end')}>
          {title}
          <Icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-gray-400')} />
        </div>
      </TableHead>
    )
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (!sortConfig.direction || !sortConfig.key) return 0

    let aVal: any = a[sortConfig.key]
    let bVal: any = b[sortConfig.key]

    if (sortConfig.key === 'date') {
      aVal = new Date(a.date).getTime()
      bVal = new Date(b.date).getTime()
    } else {
      aVal = aVal || ''
      bVal = bVal || ''
    }

    if (aVal === bVal) return 0

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    const modifier = sortConfig.direction === 'asc' ? 1 : -1
    return aVal < bVal ? -1 * modifier : 1 * modifier
  })

  const isMedico = user?.role === 'medico'
  const isAllSelected = sortedExpenses.length > 0 && selectedIds.size === sortedExpenses.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < sortedExpenses.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedExpenses.map((tx) => tx.id)))
    } else {
      setSelectedIds(new Set())
    }
    setLastSelectedIdx(null)
  }

  const handleSelectRow = (id: string, index: number, shiftKey: boolean) => {
    const newSelected = new Set(selectedIds)
    const targetState = !selectedIds.has(id)

    if (shiftKey && lastSelectedIdx !== null) {
      const start = Math.min(lastSelectedIdx, index)
      const end = Math.max(lastSelectedIdx, index)
      for (let i = start; i <= end; i++) {
        if (targetState) {
          newSelected.add(sortedExpenses[i].id)
        } else {
          newSelected.delete(sortedExpenses[i].id)
        }
      }
    } else {
      if (targetState) {
        newSelected.add(id)
      } else {
        newSelected.delete(id)
      }
    }
    setSelectedIds(newSelected)
    setLastSelectedIdx(index)
  }

  const executeBulkDelete = async () => {
    try {
      setIsDeletingBulk(true)
      await Promise.all(Array.from(selectedIds).map((id) => deleteTransaction(id)))
      toast({
        title: 'Sucesso',
        description: `${selectedIds.size} registro(s) excluído(s) com sucesso.`,
      })
      setSelectedIds(new Set())
      setIsBulkDialogOp(false)
      loadData()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir os registros.',
      })
    } finally {
      setIsDeletingBulk(false)
    }
  }

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
                {isMedico && (
                  <TableHead className="w-[40px] pl-4">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                )}
                <SortableHeader title="Data" sortKey="date" />
                <SortableHeader title="Descrição" sortKey="description" />
                <SortableHeader title="Categoria" sortKey="category" />
                <SortableHeader title="Valor" sortKey="amount" alignRight />
                <TableHead className="text-right font-semibold"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isMedico ? 6 : 5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Nenhuma despesa encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                sortedExpenses.map((tx, index) => (
                  <TableRow
                    key={tx.id}
                    className={cn(
                      'hover:bg-muted/50 border-border/50 transition-colors',
                      selectedIds.has(tx.id) && 'bg-muted/50',
                    )}
                  >
                    {isMedico && (
                      <TableCell className="pl-4">
                        <div
                          onClickCapture={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelectRow(tx.id, index, e.shiftKey)
                          }}
                          className="flex h-5 w-5 items-center justify-center cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedIds.has(tx.id)}
                            className="pointer-events-none"
                            tabIndex={-1}
                          />
                        </div>
                      </TableCell>
                    )}
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl shadow-elevation border-0"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center"
                            onClick={() => setEditingTx(tx)}
                          >
                            <Edit2 size={16} className="mr-2 text-primary" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center"
                            onClick={() => setDeletingTx(tx)}
                          >
                            <Trash2 size={16} className="mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditTransactionModal
        transaction={editingTx}
        open={!!editingTx}
        onOpenChange={(op) => !op && setEditingTx(null)}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deletingTx} onOpenChange={(op) => !op && setDeletingTx(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer apagar esta despesa permanentemente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white rounded-full hover:bg-destructive/90"
              onClick={async () => {
                if (deletingTx?.id) {
                  await deleteTransaction(deletingTx.id)
                  loadData()
                  setDeletingTx(null)
                }
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isMedico && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {selectedIds.size} {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <div className="h-4 w-px bg-border"></div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => setSelectedIds(new Set())}
          >
            Limpar seleção
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            onClick={() => setIsBulkDialogOp(true)}
          >
            Excluir selecionados
          </Button>
        </div>
      )}

      <AlertDialog open={isBulkDialogOp} onOpenChange={setIsBulkDialogOp}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedIds.size} registro(s). Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={isDeletingBulk}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white rounded-full hover:bg-destructive/90"
              disabled={isDeletingBulk}
              onClick={(e) => {
                e.preventDefault()
                executeBulkDelete()
              }}
            >
              {isDeletingBulk ? 'Excluindo...' : `Excluir ${selectedIds.size} registros`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
