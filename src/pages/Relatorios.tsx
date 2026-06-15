import { RelatoriosProvider } from '@/components/relatorios/RelatoriosContext'
import { RelatoriosFilters } from '@/components/relatorios/RelatoriosFilters'
import { BlockProfitability } from '@/components/relatorios/BlockProfitability'
import { BlockPatientValue } from '@/components/relatorios/BlockPatientValue'
import { BlockSeasonality } from '@/components/relatorios/BlockSeasonality'
import { BlockRankings } from '@/components/relatorios/BlockRankings'

export default function Relatorios() {
  return (
    <RelatoriosProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Acompanhe métricas financeiras detalhadas, sazonalidade e valor dos pacientes.
          </p>
        </div>

        <RelatoriosFilters />

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">A - Rentabilidade Real</h2>
            <BlockProfitability />
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">C - Valor do Paciente (LTV)</h2>
            <BlockPatientValue />
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">D - Sazonalidade & Projeção</h2>
            <BlockSeasonality />
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">E - Rankings & Destaques</h2>
            <BlockRankings />
          </section>
        </div>
      </div>
    </RelatoriosProvider>
  )
}
