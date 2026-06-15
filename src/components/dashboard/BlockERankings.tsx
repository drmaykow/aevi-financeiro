import { useDashboard, filterByPeriod, PeriodFilter } from './DashboardContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricTooltip } from './MetricTooltip'
import { formatCurrency } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function BlockERankings() {
  const { allTransactions, doctorFilter } = useDashboard()
  const [localPeriod, setLocalPeriod] = useState<PeriodFilter>('current_month')
  const [patientSort, setPatientSort] = useState<'rev' | 'count'>('rev')

  const data = useMemo(() => {
    const txs = filterByPeriod(allTransactions, localPeriod)
    const entries = txs.filter(
      (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
    )

    const patientsMap = new Map<string, { rev: number; count: number; first: Date; last: Date }>()
    const procMap = new Map<string, { count: number; rev: number }>()

    let totalRev = 0

    entries.forEach((t) => {
      totalRev += t.amount
      if (t.patient) {
        const name = t.patient.trim()
        const p = patientsMap.get(name) || {
          rev: 0,
          count: 0,
          first: new Date(t.date),
          last: new Date(t.date),
        }
        p.rev += t.amount
        p.count += 1
        const td = new Date(t.date)
        if (td < p.first) p.first = td
        if (td > p.last) p.last = td
        patientsMap.set(name, p)
      }

      let procs: string[] = []
      if (Array.isArray(t.procedures)) procs = t.procedures
      else if (typeof t.procedures === 'string') procs = [t.procedures]
      else if (t.category) procs = [t.category]

      const valPerProc = procs.length > 0 ? t.amount / procs.length : t.amount
      procs.forEach((pr) => {
        const p = procMap.get(pr) || { count: 0, rev: 0 }
        p.count += 1
        p.rev += valPerProc
        procMap.set(pr, p)
      })
    })

    const topPatients = Array.from(patientsMap.entries())
      .map(([name, d]) => ({ name, ...d, ticket: d.count > 0 ? d.rev / d.count : 0 }))
      .sort((a, b) => (patientSort === 'rev' ? b.rev - a.rev : b.count - a.count))
      .slice(0, 10)
    const topProcs = Array.from(procMap.entries())
      .map(([name, d]) => ({
        name,
        ...d,
        ticket: d.count > 0 ? d.rev / d.count : 0,
        pct: totalRev > 0 ? (d.rev / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { topPatients, topProcs }
  }, [allTransactions, doctorFilter, localPeriod, patientSort])

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      <Card className="rounded-2xl border-none shadow-subtle flex flex-col overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/10">
          <div className="flex flex-row justify-between items-start mb-4">
            <CardTitle className="text-base font-bold text-foreground flex-1">
              Ranking de Pacientes
            </CardTitle>
            <MetricTooltip
              what="Os 10 melhores pacientes no período."
              how="Ordenados pelo volume total de receita gerada ou pela frequência de visitas."
              why="Identifica os clientes VIPs para ações de fidelização."
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <ToggleGroup
              type="single"
              value={patientSort}
              onValueChange={(v) => v && setPatientSort(v as any)}
              className="justify-start border p-1 rounded-lg w-fit bg-background shadow-sm"
            >
              <ToggleGroupItem
                value="rev"
                className="text-xs h-7 px-3 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                Por Receita
              </ToggleGroupItem>
              <ToggleGroupItem
                value="count"
                className="text-xs h-7 px-3 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                Por Frequência
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={localPeriod}
              onValueChange={(v) => v && setLocalPeriod(v as any)}
              className="justify-start flex-wrap gap-1"
            >
              <ToggleGroupItem
                value="current_month"
                className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
              >
                Mês atual
              </ToggleGroupItem>
              <ToggleGroupItem
                value="last_6_months"
                className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
              >
                6 Meses
              </ToggleGroupItem>
              <ToggleGroupItem
                value="always"
                className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
              >
                Sempre
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              )}
              {data.topPatients.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="text-center">
                    {i < 3 ? (
                      <Badge
                        variant="default"
                        className={cn(
                          'px-2 font-bold',
                          i === 0
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : i === 1
                              ? 'bg-slate-400 hover:bg-slate-500 text-white'
                              : 'bg-amber-700 hover:bg-amber-800 text-white',
                        )}
                      >
                        {i + 1}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground font-medium">{i + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-[120px]">{p.name}</TableCell>
                  <TableCell className="text-right font-semibold text-primary/80">
                    {formatCurrency(p.rev)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center bg-secondary text-secondary-foreground rounded-full h-6 min-w-[24px] px-2 text-xs font-bold">
                      {p.count}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/10">
          <div className="flex flex-row justify-between items-start mb-4">
            <CardTitle className="text-base font-bold text-foreground flex-1">
              Ranking de Procedimentos
            </CardTitle>
            <MetricTooltip
              what="Os 10 serviços mais executados."
              how="Quantidade realizada e percentual que representam na receita total."
              why="Aponta onde concentrar estoques e esforços de venda."
            />
          </div>
          <div className="flex items-center h-9">
            <span className="text-xs text-muted-foreground">
              Acompanha o filtro de período local definido ao lado.
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Serviço</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topProcs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              )}
              {data.topProcs.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium truncate max-w-[120px] capitalize">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center bg-secondary text-secondary-foreground rounded-full h-6 min-w-[24px] px-2 text-xs font-bold">
                      {p.count}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary/80">
                    {formatCurrency(p.rev)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-muted-foreground">
                    {p.pct.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
