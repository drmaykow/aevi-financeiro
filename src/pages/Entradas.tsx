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
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { UnifiedEntryForm } from '@/components/financeiro/UnifiedEntryForm'
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
import {
  getTransactionsPaginated,
  TransactionRecord,
  deleteTransaction,
} from '@/services/transactions'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getDateFilter, generatePagination } from '@/lib/pagination-utils'

export default function Entradas() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [period, setPeriod] = useState('Mês atual')
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

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

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(t)
  }, [search])

  const loadData = async () => {
    setLoading(true)
    try {
      const typeFilter = "type = 'entry'"
      const dateFilter = getDateFilter(period)

      const filters = [typeFilter]
      if (dateFilter) filters.push(dateFilter)
      if (debouncedSearch) {
        const safeSearch = debouncedSearch.replace(/"/g, '\\"')
        filters.push(`(entry_type ~ "${safeSearch}" || patient ~ "${safeSearch}")`)
      }

      let sortStr = '-date'
      if (sortConfig.key && sortConfig.direction) {
        let pbSortKey = sortConfig.key
        if (pbSortKey === 'type_proc') pbSortKey = 'entry_type'
        sortStr = sortConfig.direction === 'desc' ? `-${pbSortKey}` : pbSortKey
      }

      const res = await getTransactionsPaginated(page, limit, {
        filter: filters.join(' && '),
        sort: sortStr,
      })

      setTransactions(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)

      setSelectedIds(new Set())
      setLastSelectedIdx(null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, period, debouncedSearch, sortConfig.key, sortConfig.direction])

  useRealtime('transactions', () => {
    loadData()
  })

  const handleSort = (key: string) => {
    let direction: 'desc' | 'asc' | null = 'desc'
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') direction = 'asc'
      else if (sortConfig.direction === 'asc') direction = null
    }
    setSortConfig({ key: direction ? key : '', direction })
    setPage(1)
  }

  const handlePeriodChange = (val: string) => {
    setPeriod(val)
    setPage(1)
  }

  const handleLimitChange = (val: number) => {
    setLimit(val)
    setPage(1)
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

  const isMedico = user?.role === 'medico'
  const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < transactions.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(transactions.map((tx) => tx.id as string)))
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
        const rowId = transactions[i].id as string
        if (targetState) {
          newSelected.add(rowId)
        } else {
          newSelected.delete(rowId)
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative max-w-sm w-full sm:w-[300px]">
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
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px] h-10 rounded-full bg-card shadow-sm border-none">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-elevation border-0">
              <SelectItem value="Mês atual">Mês atual</SelectItem>
              <SelectItem value="Mês anterior">Mês anterior</SelectItem>
              <SelectItem value="Últimos 3 meses">Últimos 3 meses</SelectItem>
              <SelectItem value="Últimos 6 meses">Últimos 6 meses</SelectItem>
              <SelectItem value="Ano atual">Ano atual</SelectItem>
              <SelectItem value="Sempre">Sempre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full shadow-elevation hover:scale-105 transition-transform bg-secondary hover:bg-secondary/90 text-white h-10 px-6">
              <Plus className="mr-2" size={18} /> Nova Entrada
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-secondary text-2xl font-bold tracking-tight">
                Registrar Entrada
              </SheetTitle>
            </SheetHeader>
            <UnifiedEntryForm
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
                <SortableHeader title="Tipo / Procedimento" sortKey="type_proc" />
                <SortableHeader title="Médico" sortKey="doctor" />
                <SortableHeader title="Paciente" sortKey="patient" />
                <SortableHeader title="Origem" sortKey="patient_source" />
                <SortableHeader title="Valor" sortKey="amount" alignRight />
                <TableHead className="text-right font-semibold"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {isMedico && (
                      <TableCell className="pl-4">
                        <Skeleton className="h-5 w-5" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isMedico ? 8 : 7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Nenhuma entrada encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx, index) => (
                  <TableRow
                    key={tx.id}
                    className={cn(
                      'hover:bg-muted/50 border-border/50 transition-colors',
                      selectedIds.has(tx.id as string) && 'bg-muted/50',
                    )}
                  >
                    {isMedico && (
                      <TableCell className="pl-4">
                        <div
                          onClickCapture={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelectRow(tx.id as string, index, e.shiftKey)
                          }}
                          className="flex h-5 w-5 items-center justify-center cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedIds.has(tx.id as string)}
                            className="pointer-events-none"
                            tabIndex={-1}
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{tx.entry_type}</div>
                      {tx.procedures && tx.procedures.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {tx.procedures.join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-medium',
                          tx.doctor?.includes('Maykow')
                            ? 'bg-[#1e3a8a]/10 text-[#1e3a8a] border-[#1e3a8a]/20'
                            : tx.doctor?.includes('Ana')
                              ? 'bg-[#800020]/10 text-[#800020] border-[#800020]/20'
                              : 'text-secondary border-secondary/20 bg-secondary/5',
                        )}
                      >
                        {tx.doctor}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.patient || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.patient_source || '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-secondary">
                      {formatCurrency(tx.amount)}
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          Exibindo {totalItems > 0 ? (page - 1) * limit + 1 : 0}–
          {Math.min(page * limit, totalItems)} de {totalItems} registros
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <Select value={String(limit)} onValueChange={(v) => handleLimitChange(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 bg-card border-none shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && setPage(page - 1)}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {generatePagination(page, totalPages).map((p, i) => (
                <PaginationItem key={i}>
                  {p === '...' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setPage(p as number)}
                      isActive={page === p}
                      className={cn(
                        'cursor-pointer',
                        page === p &&
                          'bg-secondary text-white hover:bg-secondary/90 hover:text-white',
                      )}
                    >
                      {p}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && setPage(page + 1)}
                  className={
                    page === totalPages || totalPages === 0
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <EditTransactionModal
        transaction={editingTx}
        open={!!editingTx}
        onOpenChange={(op) => !op && setEditingTx(null)}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deletingTx} onOpenChange={(op) => !op && setDeletingTx(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que quer apagar esta entrada permanentemente?
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
