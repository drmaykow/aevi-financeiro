import { useDashboard } from './DashboardContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricTooltip } from './MetricTooltip'
import { formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'
import {
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isWeekend,
  getDaysInMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function BlockDSeasonality() {
  const { allTransactions, doctorFilter } = useDashboard()

  const { heatmap, forecast, maxRev } = useMemo(() => {
    const now = new Date()
    const heatmap = []
    let maxRev = 0

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i)
      const start = startOfMonth(d)
      const end = endOfMonth(d)

      const txs = allTransactions.filter((t) => {
        const td = new Date(t.date)
        return td >= start && td <= end
      })

      const entries = txs.filter(
        (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
      )
      const rev = entries.reduce((s, t) => s + t.amount, 0)

      const clinicRev = txs.filter((t) => t.type === 'entry').reduce((s, t) => s + t.amount, 0)
      const ratio = clinicRev > 0 && doctorFilter !== 'todos' ? rev / clinicRev : 1
      const mkt = txs
        .filter(
          (t) =>
            t.type === 'exit' &&
            t.category === 'MARKETING' &&
            (doctorFilter === 'todos' || t.doctor === doctorFilter),
        )
        .reduce((s, t) => s + t.amount, 0)
      const otherCosts =
        txs
          .filter((t) => t.type === 'exit' && t.category !== 'MARKETING')
          .reduce((s, t) => s + t.amount, 0) * ratio
      const costs = mkt + otherCosts
      const profit = rev - costs

      if (rev > maxRev) maxRev = rev

      heatmap.push({ month: format(d, 'MMM', { locale: ptBR }), rev, costs, profit })
    }

    const currentTxs = allTransactions.filter((t) =>
      isWithinInterval(new Date(t.date), { start: startOfMonth(now), end: now }),
    )
    const currentRev = currentTxs
      .filter((t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter))
      .reduce((s, t) => s + t.amount, 0)

    let elapsed = 0
    let total = 0
    const daysInMonth = getDaysInMonth(now)
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i)
      if (!isWeekend(d)) {
        total++
        if (d <= now) elapsed++
      }
    }
    const projectedRev = (currentRev / Math.max(1, elapsed)) * total

    return {
      heatmap,
      forecast: {
        currentRev,
        projectedRev,
        pct: projectedRev > 0 ? (currentRev / projectedRev) * 100 : 0,
      },
      maxRev,
    }
  }, [allTransactions, doctorFilter])

  return (
    <div className="grid gap-4 md:grid-cols-2 mt-6">
      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Sazonalidade (12 Meses)
          </CardTitle>
          <MetricTooltip
            what="Mapa de calor da receita anual."
            how="Cores mais escuras representam meses com maior volume de faturamento."
            why="Ajuda a planejar férias e campanhas em meses de baixa."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="flex gap-1 h-36 items-end pt-4">
            {heatmap.map((m, i) => (
              <Tooltip key={i} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className="flex-1 rounded-t cursor-pointer hover:ring-2 ring-primary/50 transition-all"
                    style={{
                      height: `${Math.max(10, maxRev > 0 ? (m.rev / maxRev) * 100 : 10)}%`,
                      backgroundColor:
                        maxRev > 0 && m.rev > 0
                          ? `rgba(22, 163, 74, ${Math.max(0.15, m.rev / maxRev)})`
                          : '#f1f5f9',
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-gray-900 text-white border-none p-3 space-y-1 rounded-xl shadow-xl z-50"
                >
                  <div className="font-bold text-base capitalize">{m.month}</div>
                  <div className="text-sm text-gray-300">Receita: {formatCurrency(m.rev)}</div>
                  <div className="text-sm text-gray-300">Custos: {formatCurrency(m.costs)}</div>
                  <div className="text-sm font-semibold mt-1 pt-1 border-t border-gray-700">
                    Lucro: {formatCurrency(m.profit)}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            {heatmap.map((m, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[10px] text-muted-foreground capitalize font-medium"
              >
                {m.month.substring(0, 3)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Projeção Linear (Mês Atual)
          </CardTitle>
          <MetricTooltip
            what="Estimativa de fechamento do mês atual."
            how="(Receita atual / Dias úteis corridos) × Total de dias úteis do mês."
            why="Prevê se a meta do mês será atingida com o ritmo atual."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center gap-8 px-8">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Realizado até agora</p>
              <p className="text-3xl font-bold">{formatCurrency(forecast.currentRev)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Projetado final</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(forecast.projectedRev)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${Math.min(forecast.pct, 100)}%` }}
              />
            </div>
            <div className="text-right text-xs font-semibold text-muted-foreground">
              {forecast.pct.toFixed(1)}% do projetado atingido
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
