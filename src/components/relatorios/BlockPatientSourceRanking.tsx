import { useMemo, useState } from 'react'
import { useRelatorios, filterByPeriod, PeriodFilter } from './RelatoriosContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricTooltip } from '@/components/dashboard/MetricTooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export type PatientSourcePeriod =
  | 'current_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'current_year'
  | 'always'

interface SourceItem {
  source: string
  count: number
  pct: number
  color: string
}

// Paleta harmoniosa e distinta para canais de aquisição
const SOURCE_COLORS: Record<string, string> = {
  Google: '#3b82f6', // Azul
  'Já é paciente': '#10b981', // Verde esmeralda
  'Médico(a)': '#8b5cf6', // Violeta
  Paciente: '#06b6d4', // Ciano
  Instagram: '#ec4899', // Rosa pink
  Facebook: '#1d4ed8', // Azul royal
  'Tik Tok': '#000000', // Preto/Cinza escuro
  Youtube: '#ef4444', // Vermelho
  Doctorália: '#0ea5e9', // Azul céu
  ECO: '#14b8a6', // Teal
  'Chat GPT': '#10a37f', // Verde OpenAI
  Outros: '#f59e0b', // Âmbar
  Desconhecido: '#94a3b8', // Cinza slate
}

const FALLBACK_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#84cc16',
  '#d946ef',
  '#f97316',
  '#94a3b8',
]

function getSourceColor(source: string, index: number): string {
  if (SOURCE_COLORS[source]) return SOURCE_COLORS[source]
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
}

export function BlockPatientSourceRanking() {
  const { allTransactions, doctorFilter } = useRelatorios()
  const [period, setPeriod] = useState<PatientSourcePeriod>('current_month')

  const { items, totalPatients } = useMemo(() => {
    // Mapeamento das 5 opções solicitadas
    // "Mês atual" -> current_month
    // "3 meses" -> last_3_months
    // "6 meses" -> last_6_months
    // "1 ano" -> current_year (ou 1 ano corrido)
    // "Sempre" -> always
    const txs = filterByPeriod(allTransactions, period as PeriodFilter)
    const entries = txs.filter(
      (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
    )

    const counts = new Map<string, number>()
    let total = 0

    entries.forEach((t) => {
      let src = (t.patient_source || '').trim()
      // Seguimento foi renomeado para Já é paciente (migration 0020)
      if (src.toLowerCase() === 'seguimento') {
        src = 'Já é paciente'
      }
      if (!src) {
        src = 'Desconhecido'
      }

      counts.set(src, (counts.get(src) || 0) + 1)
      total += 1
    })

    const sorted = Array.from(counts.entries())
      .map(([source, count], idx) => ({
        source,
        count,
        pct: total > 0 ? (count / total) * 100 : 0,
        color: getSourceColor(source, idx),
      }))
      .sort((a, b) => b.count - a.count)

    return { items: sorted, totalPatients: total }
  }, [allTransactions, doctorFilter, period])

  return (
    <Card className="rounded-2xl border-none shadow-subtle flex flex-col overflow-hidden">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <div className="flex flex-row justify-between items-start mb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground">
              Distribuição por Origem do Paciente
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Canais de captação para orientar decisões de investimento em tráfego e marketing.
            </p>
          </div>
          <MetricTooltip
            what="Distribuição de pacientes conforme o canal de origem informado na entrada."
            how="Total de pacientes em cada origem e percentual relativo ao total do período selecionado."
            why="Permite identificar quais fontes (Google, Instagram, indicações, etc.) trazem mais volume e onde focar o orçamento de tráfego."
          />
        </div>

        {/* Seletor de período com as 5 opções pedidas: Mês atual, 3 meses, 6 meses, 1 ano, Sempre */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(v) => v && setPeriod(v as PatientSourcePeriod)}
            className="justify-start flex-wrap gap-1"
          >
            <ToggleGroupItem
              value="current_month"
              className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              Mês atual
            </ToggleGroupItem>
            <ToggleGroupItem
              value="last_3_months"
              className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              3 meses
            </ToggleGroupItem>
            <ToggleGroupItem
              value="last_6_months"
              className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              6 meses
            </ToggleGroupItem>
            <ToggleGroupItem
              value="current_year"
              className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              1 ano
            </ToggleGroupItem>
            <ToggleGroupItem
              value="always"
              className="text-[10px] h-6 px-3 rounded-full border bg-background data-[state=on]:border-primary data-[state=on]:text-primary"
            >
              Sempre
            </ToggleGroupItem>
          </ToggleGroup>

          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
            Total: <span className="text-foreground font-bold">{totalPatients}</span> atendimentos
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum paciente registrado no período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Gráfico de Pizza */}
            <div className="lg:col-span-5 h-[280px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SourceItem
                        return (
                          <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs space-y-1 z-50">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: data.color }}
                              />
                              <span>{data.source}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Pacientes:{' '}
                              <span className="font-bold text-foreground">{data.count}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Participação:{' '}
                              <span className="font-bold text-foreground">
                                {data.pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Pie
                    data={items}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {items.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Informação central (Donut Center) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  {totalPatients}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Pacientes
                </span>
              </div>
            </div>

            {/* Ranking / Legenda detalhada de cada fatia com contagem e % */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className="text-xs font-semibold truncate text-foreground"
                        title={item.source}
                      >
                        {item.source}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-foreground">{item.count}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        ({item.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
