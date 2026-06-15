import { useDashboard } from './DashboardContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricTooltip } from './MetricTooltip'
import { formatCurrency, cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useMemo } from 'react'

export function BlockAProfitability() {
  const { filteredTxs, doctorFilter } = useDashboard()

  const m = useMemo(() => {
    const validEntries = filteredTxs.filter(
      (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
    )
    const totalRev = validEntries.reduce((s, t) => s + t.amount, 0)

    const mkt = filteredTxs
      .filter(
        (t) =>
          t.type === 'exit' &&
          t.category === 'MARKETING' &&
          (doctorFilter === 'todos' || t.doctor === doctorFilter),
      )
      .reduce((s, t) => s + t.amount, 0)
    const clinicTotalRev = filteredTxs
      .filter((t) => t.type === 'entry')
      .reduce((s, t) => s + t.amount, 0)
    const prorateRatio =
      clinicTotalRev > 0 && doctorFilter !== 'todos' ? totalRev / clinicTotalRev : 1
    const otherCosts =
      filteredTxs
        .filter((t) => t.type === 'exit' && t.category !== 'MARKETING')
        .reduce((s, t) => s + t.amount, 0) * prorateRatio
    const totalCosts = mkt + otherCosts

    const isCons = (t: any) =>
      t.category?.toLowerCase().includes('consulta') ||
      (typeof t.procedures === 'string' && t.procedures.toLowerCase().includes('consulta'))
    const isProc = (t: any) =>
      t.category?.toLowerCase().includes('procedimento') ||
      (typeof t.procedures === 'string' && t.procedures.toLowerCase().includes('procedimento'))

    const consRev = validEntries.filter(isCons).reduce((s, t) => s + t.amount, 0)
    const procRev = validEntries.filter(isProc).reduce((s, t) => s + t.amount, 0)

    const consCost = totalRev > 0 ? totalCosts * (consRev / totalRev) : 0
    const procCost = totalRev > 0 ? totalCosts * (procRev / totalRev) : 0
    const consMargin = consRev > 0 ? ((consRev - consCost) / consRev) * 100 : 0
    const procMargin = procRev > 0 ? ((procRev - procCost) / procRev) * 100 : 0

    const fixTxs =
      filteredTxs
        .filter(
          (t) =>
            t.type === 'exit' &&
            [
              'ALUGUEL',
              'LUZ',
              'INTERNET',
              'CONDOMINIO',
              'SECRETARIA',
              'CONTADOR',
              'IMPOSTOS/TAXAS',
            ].includes(t.category),
        )
        .reduce((s, t) => s + t.amount, 0) * prorateRatio
    const supTxs =
      filteredTxs
        .filter((t) => t.type === 'exit' && t.category === 'MATERIAL E INSUMO')
        .reduce((s, t) => s + t.amount, 0) * prorateRatio
    const varRatio = totalRev > 0 ? (supTxs + mkt) / totalRev : 0
    const be = varRatio < 1 ? fixTxs / (1 - varRatio) : 0
    const avgTkt = validEntries.length > 0 ? totalRev / validEntries.length : 0
    const beCons = avgTkt > 0 ? be / avgTkt : 0
    const opIdx = totalRev > 0 ? (totalCosts / totalRev) * 100 : 0

    return { consMargin, procMargin, be, beCons, opIdx }
  }, [filteredTxs, doctorFilter])

  const getColor = (v: number, invert = false) => {
    if (invert) return v <= 55 ? 'text-green-600' : v <= 70 ? 'text-yellow-600' : 'text-red-600'
    return v >= 30 ? 'text-green-600' : v >= 15 ? 'text-yellow-600' : 'text-red-600'
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Margem por Serviço
          </CardTitle>
          <MetricTooltip
            what="Lucratividade de consultas versus procedimentos."
            how="Receita do tipo - (Custos totais * peso da receita do tipo)."
            why="Identifica qual serviço traz mais retorno real."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center space-y-4">
          <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
            <span className="text-sm font-medium">Consultas</span>
            <span className={cn('text-lg font-bold', getColor(m.consMargin))}>
              {m.consMargin.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg">
            <span className="text-sm font-medium">Procedimentos</span>
            <span className={cn('text-lg font-bold', getColor(m.procMargin))}>
              {m.procMargin.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Ponto de Equilíbrio (Mês)
          </CardTitle>
          <MetricTooltip
            what="Faturamento mínimo para não ter prejuízo."
            how="(Custos Fixos + Impostos) / (1 - (Insumos + Marketing) / Receita Bruta)."
            why="Meta mínima de sobrevivência do mês."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="text-3xl font-bold">{formatCurrency(m.be)}</div>
          <p className="text-sm text-muted-foreground mt-2 bg-muted/20 p-2 rounded-lg">
            equivale a <span className="font-semibold text-foreground">{m.beCons.toFixed(1)}</span>{' '}
            consultas ao ticket médio atual
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Índice de Despesa Operacional
          </CardTitle>
          <MetricTooltip
            what="Comprometimento da receita com custos."
            how="Custos Totais / Receita Bruta * 100."
            why="Mede a eficiência operacional (ideal < 55%)."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center space-y-4">
          <div className={cn('text-4xl font-black', getColor(m.opIdx, true))}>
            {m.opIdx.toFixed(1)}%
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex">
            <div
              className={cn(
                'h-full transition-all duration-500',
                m.opIdx <= 55 ? 'bg-green-600' : m.opIdx <= 70 ? 'bg-yellow-600' : 'bg-red-600',
              )}
              style={{ width: `${Math.min(m.opIdx, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
