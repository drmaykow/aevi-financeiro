import { useMemo } from 'react'
import useMainStore from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, CartesianGrid } from 'recharts'

export default function Relatorios() {
  const { transactions } = useMainStore()
  const { toast } = useToast()

  const { donutData, barData, donutConfig, barConfig } = useMemo(() => {
    const expensesMap: Record<string, number> = {}
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((tx) => {
        expensesMap[tx.category] = (expensesMap[tx.category] || 0) + tx.amount
      })

    const dConfig: Record<string, any> = {}
    const donut = Object.entries(expensesMap)
      .map(([name, value], index) => {
        const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`
        dConfig[name] = { label: name, color: colorVar }
        return { name, value, fill: colorVar }
      })
      .sort((a, b) => b.value - a.value)

    const now = new Date()
    const monthsMap: Record<string, { Receitas: number; Despesas: number }> = {}
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mName = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      monthsMap[mName] = { Receitas: 0, Despesas: 0 }
    }

    transactions.forEach((tx) => {
      const d = new Date(tx.date)
      const mName = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (monthsMap[mName]) {
        if (tx.type === 'INCOME') monthsMap[mName].Receitas += tx.amount
        else monthsMap[mName].Despesas += tx.amount
      }
    })

    const bar = Object.keys(monthsMap).map((name) => ({
      name,
      Receitas: monthsMap[name].Receitas,
      Despesas: monthsMap[name].Despesas,
    }))

    const bConfig = {
      Receitas: { label: 'Receitas', color: 'hsl(var(--secondary))' },
      Despesas: { label: 'Despesas', color: 'hsl(var(--primary))' },
    }

    return { donutData: donut, barData: bar, donutConfig: dConfig, barConfig: bConfig }
  }, [transactions])

  const handleExport = () => {
    toast({ title: 'Exportação Iniciada', description: 'O relatório PDF está sendo gerado.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          variant="outline"
          className="rounded-full shadow-sm bg-card hover:bg-muted border-none"
        >
          <Download className="mr-2" size={16} /> Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={donutConfig} className="h-[300px] w-full max-w-sm">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-subtle">
          <CardHeader>
            <CardTitle>Crescimento (Últimos 3 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-[300px] w-full">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Receitas"
                  fill="var(--color-Receitas)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Bar
                  dataKey="Despesas"
                  fill="var(--color-Despesas)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
