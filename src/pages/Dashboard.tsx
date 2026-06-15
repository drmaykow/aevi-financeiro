import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatCurrency, cn } from '@/lib/utils'
import { Minus, TrendingUp, TrendingDown, Users, DollarSign, Activity } from 'lucide-react'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { DashboardProvider, useDashboard } from '@/components/dashboard/DashboardContext'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
  isWithinInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const chartConfig = {
  Faturamento: { label: 'Faturamento', color: '#1e3a8a' },
  Lucro: { label: 'Lucro', color: '#16a34a' },
}

function Variation({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = value > 0
  const isNegative = value < 0

  let color = 'text-muted-foreground'
  if (isPositive) color = inverse ? 'text-red-600' : 'text-green-600'
  else if (isNegative) color = inverse ? 'text-green-600' : 'text-red-600'

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className={cn('flex items-center text-xs font-medium', color)}>
      <Icon size={14} className="mr-1" />
      {Math.abs(value).toFixed(1)}%
    </div>
  )
}

function DashboardInner() {
  const { allTransactions, period, doctorFilter } = useDashboard()

  const dashboardData = useMemo(() => {
    const now = new Date()
    const validTransactions = allTransactions

    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date

    currentEnd = now

    switch (period) {
      case 'current_month':
        currentStart = startOfMonth(now)
        currentEnd = now
        previousStart = startOfMonth(subMonths(now, 1))
        previousEnd = endOfMonth(subMonths(now, 1))
        break
      case 'last_month':
        currentStart = startOfMonth(subMonths(now, 1))
        currentEnd = endOfMonth(subMonths(now, 1))
        previousStart = startOfMonth(subMonths(now, 2))
        previousEnd = endOfMonth(subMonths(now, 2))
        break
      case 'last_3_months':
        currentStart = startOfMonth(subMonths(now, 2))
        currentEnd = now
        previousStart = startOfMonth(subMonths(now, 5))
        previousEnd = endOfMonth(subMonths(now, 3))
        break
      case 'last_6_months':
        currentStart = startOfMonth(subMonths(now, 5))
        currentEnd = now
        previousStart = startOfMonth(subMonths(now, 11))
        previousEnd = endOfMonth(subMonths(now, 6))
        break
      case 'current_year':
        currentStart = startOfYear(now)
        currentEnd = now
        previousStart = startOfYear(subYears(now, 1))
        previousEnd = endOfYear(subYears(now, 1))
        break
      case 'last_year':
        currentStart = startOfYear(subYears(now, 1))
        currentEnd = endOfYear(subYears(now, 1))
        previousStart = startOfYear(subYears(now, 2))
        previousEnd = endOfYear(subYears(now, 2))
        break
      case 'always':
        currentStart = new Date(0)
        currentEnd = now
        previousStart = new Date(0)
        previousEnd = new Date(0)
        break
      default:
        currentStart = startOfMonth(now)
        currentEnd = now
        previousStart = startOfMonth(subMonths(now, 1))
        previousEnd = endOfMonth(subMonths(now, 1))
    }

    const currentTxs = validTransactions.filter((tx) =>
      isWithinInterval(new Date(tx.date), { start: currentStart, end: currentEnd }),
    )

    const previousTxs = validTransactions.filter((tx) =>
      isWithinInterval(new Date(tx.date), { start: previousStart, end: previousEnd }),
    )

    const calcHealth = (txs: any[]) => {
      const rev = txs
        .filter(
          (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
        )
        .reduce((sum, t) => sum + t.amount, 0)
      const costs = txs.filter((t) => t.type === 'exit').reduce((sum, t) => sum + t.amount, 0)
      const profit = rev - costs
      const margin = rev > 0 ? (profit / rev) * 100 : 0
      return { rev, costs, profit, margin }
    }

    const currentHealth = calcHealth(currentTxs)
    const prevHealth = calcHealth(previousTxs)

    const calcVar = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / Math.abs(prev)) * 100
    }

    const entries = currentTxs.filter(
      (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
    )
    const atendimentos = entries.length
    const ticketMedio = atendimentos > 0 ? currentHealth.rev / atendimentos : 0

    const drMaykowRev = currentTxs
      .filter((t) => t.type === 'entry' && t.doctor === 'Dr. Maykow')
      .reduce((sum, t) => sum + t.amount, 0)
    const draAnaRev = currentTxs
      .filter((t) => t.type === 'entry' && t.doctor === 'Dra. Ana Cláudia')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalRev = currentTxs
      .filter((t) => t.type === 'entry')
      .reduce((sum, t) => sum + t.amount, 0)
    const drMaykowPct = totalRev > 0 ? (drMaykowRev / totalRev) * 100 : 0
    const draAnaPct = totalRev > 0 ? (draAnaRev / totalRev) * 100 : 0

    const isNewPatient = (procedures: any) => {
      if (Array.isArray(procedures))
        return procedures.some(
          (p) => typeof p === 'string' && p.toLowerCase().includes('primeira consulta'),
        )
      if (typeof procedures === 'string')
        return procedures.toLowerCase().includes('primeira consulta')
      return false
    }

    const pacientesNovas = entries.filter((t) => isNewPatient(t.procedures)).length
    const marketingCosts = currentTxs
      .filter((t) => t.type === 'exit' && t.category === 'MARKETING')
      .reduce((sum, t) => sum + t.amount, 0)
    const cac = pacientesNovas > 0 ? marketingCosts / pacientesNovas : null

    return {
      revenue: currentHealth.rev,
      costs: currentHealth.costs,
      profit: currentHealth.profit,
      margin: currentHealth.margin,
      revenueVar: calcVar(currentHealth.rev, prevHealth.rev),
      costsVar: calcVar(currentHealth.costs, prevHealth.costs),
      profitVar: calcVar(currentHealth.profit, prevHealth.profit),
      marginVar: currentHealth.margin - prevHealth.margin,
      atendimentos,
      ticketMedio,
      drMaykowRev,
      draAnaRev,
      drMaykowPct,
      draAnaPct,
      pacientesNovas,
      cac,
    }
  }, [allTransactions, period, doctorFilter])

  const chartData = useMemo(() => {
    const now = new Date()
    const validTransactions = allTransactions
    const data = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const monthStart = startOfMonth(d)
      const monthEnd = i === 0 ? now : endOfMonth(d)
      const monthTxs = validTransactions.filter((tx) =>
        isWithinInterval(new Date(tx.date), { start: monthStart, end: monthEnd }),
      )

      const rev = monthTxs
        .filter(
          (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
        )
        .reduce((sum, t) => sum + t.amount, 0)
      const costs = monthTxs.filter((t) => t.type === 'exit').reduce((sum, t) => sum + t.amount, 0)

      const monthName = format(d, 'MMM', { locale: ptBR })
      data.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        Faturamento: rev,
        Lucro: rev - costs,
      })
    }
    return data
  }, [allTransactions, doctorFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <DashboardFilters />

      {/* Block 1: Health Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Bruto
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dashboardData.revenue)}
            </div>
            <Variation value={dashboardData.revenueVar} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custos Totais
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dashboardData.costs)}
            </div>
            <Variation value={dashboardData.costsVar} inverse />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Operacional
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                dashboardData.profit > 0
                  ? 'text-green-600'
                  : dashboardData.profit < 0
                    ? 'text-red-600'
                    : 'text-foreground',
              )}
            >
              {formatCurrency(dashboardData.profit)}
            </div>
            <Variation value={dashboardData.profitVar} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margem Operacional
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                dashboardData.margin >= 30
                  ? 'text-green-600'
                  : dashboardData.margin >= 15
                    ? 'text-yellow-600'
                    : 'text-red-600',
              )}
            >
              {dashboardData.margin.toFixed(1)}%
            </div>
            <Variation value={dashboardData.marginVar} />
          </CardContent>
        </Card>
      </div>

      {/* Block 2: Productivity Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Atendimentos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardData.atendimentos}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dashboardData.ticketMedio)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento por Médico
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dr. Maykow</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(dashboardData.drMaykowRev)} ({dashboardData.drMaykowPct.toFixed(1)}
                %)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dra. Ana Cláudia</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(dashboardData.draAnaRev)} ({dashboardData.draAnaPct.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block 3 & 4: Acquisition and Trend */}
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-2 space-y-4 flex flex-col">
          <Card className="rounded-2xl border-none shadow-subtle flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pacientes Novas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {dashboardData.pacientesNovas}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Primeira consulta</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-subtle flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CAC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {dashboardData.cac !== null ? formatCurrency(dashboardData.cac) : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Custo de Aquisição de Cliente</p>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-5 rounded-2xl border-none shadow-subtle flex flex-col">
          <CardHeader>
            <CardTitle>Evolução (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 flex-1">
            <ChartContainer config={chartConfig} className="h-full min-h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  stroke="#888"
                />
                <YAxis
                  tickFormatter={(val: number) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    }).format(val)
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  stroke="#888"
                  width={60}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md space-y-2">
                          <p className="text-sm font-medium">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-sm text-muted-foreground">{entry.name}:</span>
                              <span className="text-sm font-bold">
                                {formatCurrency(entry.value as number)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Faturamento"
                  stroke="var(--color-Faturamento)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Lucro"
                  stroke="var(--color-Lucro)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  )
}
