import { useRelatorios } from './RelatoriosContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricTooltip } from '@/components/dashboard/MetricTooltip'
import { formatCurrency, cn } from '@/lib/utils'
import { useMemo } from 'react'

export function BlockPatientValue() {
  const { filteredTxs, doctorFilter } = useRelatorios()

  const m = useMemo(() => {
    const entries = filteredTxs.filter(
      (t) => t.type === 'entry' && (doctorFilter === 'todos' || t.doctor === doctorFilter),
    )
    const rev = entries.reduce((s, t) => s + t.amount, 0)

    const isNew = (t: any) => {
      const p = Array.isArray(t.procedures)
        ? t.procedures.join(' ').toLowerCase()
        : (t.procedures || '').toLowerCase()
      return p.includes('primeira consulta')
    }

    const firstConsults = entries.filter(isNew).length
    const returnConsults = entries.length - firstConsults

    const mkt = filteredTxs
      .filter(
        (t) =>
          t.type === 'exit' &&
          t.category === 'MARKETING' &&
          (doctorFilter === 'todos' || t.doctor === doctorFilter),
      )
      .reduce((s, t) => s + t.amount, 0)
    const cac = firstConsults > 0 ? mkt / firstConsults : 0

    const uniquePatients =
      new Set(entries.filter((t) => t.patient).map((t) => t.patient?.toLowerCase().trim())).size ||
      1
    const avgTicket = entries.length > 0 ? rev / entries.length : 0
    const annualFreq = entries.length / uniquePatients
    const ltv = avgTicket * annualFreq * 3

    const ltvCac = cac > 0 ? ltv / cac : 0
    const recRev = returnConsults * avgTicket

    return { ltv, cac, ltvCac, recRev }
  }, [filteredTxs, doctorFilter])

  const getLtvColor = (v: number) => {
    if (v === 0) return 'text-foreground'
    if (v < 3) return 'text-red-600'
    if (v <= 5) return 'text-green-600'
    return 'text-blue-600'
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mt-6">
      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            LTV Estimado (3 Anos)
          </CardTitle>
          <MetricTooltip
            what="Valor vitalício estimado que o paciente deixa na clínica."
            how="Ticket Médio × Frequência Anual × 3 Anos."
            why="Indica o teto máximo de quanto você pode investir para adquirir um paciente."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="text-3xl font-bold">{formatCurrency(m.ltv)}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Proporção LTV / CAC
          </CardTitle>
          <MetricTooltip
            what="Retorno sobre o investimento em marketing."
            how="LTV Estimado / Custo de Aquisição de Clientes (CAC)."
            why="Mede a saúde do crescimento (ideal > 3x, excelente > 5x)."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className={cn('text-4xl font-black', getLtvColor(m.ltvCac))}>
            {m.ltvCac > 0 ? `${m.ltvCac.toFixed(1)}x` : '—'}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none shadow-subtle flex flex-col">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground flex-1">
            Receita Recorrente Estimada
          </CardTitle>
          <MetricTooltip
            what="Receita gerada por pacientes em retorno."
            how="Total de retornos (exclui primeira consulta) × Ticket Médio."
            why="Mostra o poder de fidelização da clínica."
          />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="text-3xl font-bold text-foreground">{formatCurrency(m.recRev)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
