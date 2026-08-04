import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getMicroscopiaTransactions, type TransactionRecord } from '@/services/transactions'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, ArrowLeft, Microscope, History as HistoryIcon } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface PatientData {
  patient: string
  total: number
  status: 1 | 2 | 3
  history: { date: string; label: string; id?: string }[]
}

function getCycleStatus(total: number): 1 | 2 | 3 {
  const r = total % 3
  return r === 0 ? 3 : r
}

function getCycleLabel(index: number): string {
  return `${(index % 3) + 1}ª`
}

function buildPatientData(records: TransactionRecord[]): PatientData[] {
  const grouped = new Map<string, TransactionRecord[]>()
  for (const t of records) {
    const name = t.patient?.trim() || 'Sem paciente'
    if (!grouped.has(name)) grouped.set(name, [])
    grouped.get(name)!.push(t)
  }
  const result: PatientData[] = []
  for (const [patient, recs] of grouped) {
    const sorted = [...recs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    result.push({
      patient,
      total: sorted.length,
      status: getCycleStatus(sorted.length),
      history: sorted.map((r, i) => ({
        date: r.date,
        label: getCycleLabel(i),
        id: r.id,
      })),
    })
  }
  return result.sort((a, b) => a.patient.localeCompare(b.patient))
}

export default function MicroscopiaControle() {
  const [records, setRecords] = useState<TransactionRecord[]>([])
  const [search, setSearch] = useState('')
  const [historyData, setHistoryData] = useState<PatientData | null>(null)

  const loadData = async () => {
    const items = await getMicroscopiaTransactions()
    setRecords(items)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('transactions', () => {
    loadData()
  })

  const patientData = useMemo(() => buildPatientData(records), [records])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return patientData
    return patientData.filter(
      (p) => p.patient.toLowerCase().includes(q) || String(p.total).includes(q),
    )
  }, [patientData, search])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/financeiro">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Microscope className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Microscopia - Controle</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Pacientes</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou número..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="text-center">Contagem</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Histórico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.patient}>
                    <TableCell className="font-medium">{p.patient}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold">{p.total}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          'min-w-[2rem] justify-center',
                          p.status === 1 && 'bg-green-500 text-white hover:bg-green-600',
                          p.status === 2 && 'bg-yellow-500 text-white hover:bg-yellow-600',
                          p.status === 3 && 'bg-red-500 text-white hover:bg-red-600',
                        )}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => setHistoryData(p)}>
                        <HistoryIcon className="mr-1 h-4 w-4" />
                        Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">Nenhum paciente encontrado.</p>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={!!historyData}
        onOpenChange={(open) => {
          if (!open) setHistoryData(null)
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico — {historyData?.patient}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {historyData?.history.map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 rounded-lg border p-3">
                <Badge variant="outline" className="min-w-[2.5rem] justify-center font-semibold">
                  {h.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{formatDate(h.date)}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
