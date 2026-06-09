import { useMemo } from 'react'
import useMainStore from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Area, AreaChart, XAxis, CartesianGrid } from 'recharts'

const chartConfig = {
  Receitas: { label: 'Receitas', color: 'hsl(var(--secondary))' },
  Despesas: { label: 'Despesas', color: 'hsl(var(--primary))' },
}

export default function Dashboard() {
  const { transactions } = useMainStore()

  const { totalBalance, monthlyIncome, monthlyExpense, chartData, recentTransactions } =
    useMemo(() => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      let inc = 0
      let exp = 0
      let tot = 0
      const dailyData: Record<string, { income: number; expense: number }> = {}

      transactions.forEach((tx) => {
        const d = new Date(tx.date)
        const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear

        if (tx.type === 'INCOME') {
          tot += tx.amount
          if (isCurrentMonth) inc += tx.amount
        } else {
          tot -= tx.amount
          if (isCurrentMonth) exp += tx.amount
        }

        const diffTime = Math.abs(now.getTime() - d.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays <= 30) {
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          if (!dailyData[dateStr]) dailyData[dateStr] = { income: 0, expense: 0 }
          if (tx.type === 'INCOME') dailyData[dateStr].income += tx.amount
          else dailyData[dateStr].expense += tx.amount
        }
      })

      const sortedDates = Object.keys(dailyData).sort((a, b) => {
        const [da, ma] = a.split('/')
        const [db, mb] = b.split('/')
        return (
          new Date(currentYear, Number(ma) - 1, Number(da)).getTime() -
          new Date(currentYear, Number(mb) - 1, Number(db)).getTime()
        )
      })

      const cData = sortedDates.map((date) => ({
        date,
        Receitas: dailyData[date].income,
        Despesas: dailyData[date].expense,
      }))

      return {
        totalBalance: tot,
        monthlyIncome: inc,
        monthlyExpense: exp,
        chartData: cData,
        recentTransactions: transactions.slice(0, 5),
      }
    }, [transactions])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-subtle overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={64} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-secondary">
            <ArrowUpRight size={64} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{formatCurrency(monthlyIncome)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <ArrowDownRight size={64} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(monthlyExpense)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 rounded-2xl border-none shadow-subtle">
          <CardHeader>
            <CardTitle>Fluxo de Caixa (30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-Receitas)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-Receitas)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-Despesas)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-Despesas)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  stroke="#888"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="Receitas"
                  stroke="var(--color-Receitas)"
                  fill="url(#colorInc)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Despesas"
                  stroke="var(--color-Despesas)"
                  fill="url(#colorExp)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 rounded-2xl border-none shadow-subtle flex flex-col">
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}
                    >
                      {tx.type === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(tx.date)} • {tx.category}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-secondary' : 'text-foreground'}`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
