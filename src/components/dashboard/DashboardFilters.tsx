import { useDashboard } from './DashboardContext'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function DashboardFilters() {
  const { period, setPeriod, doctorFilter, setDoctorFilter } = useDashboard()

  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-5 bg-white/80 backdrop-blur-md border rounded-2xl sticky top-4 z-10 shadow-sm">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Período Global
        </span>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as any)}
          className="justify-start flex-wrap gap-2"
        >
          <ToggleGroupItem
            value="current_month"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Mês atual
          </ToggleGroupItem>
          <ToggleGroupItem
            value="last_month"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Mês anterior
          </ToggleGroupItem>
          <ToggleGroupItem
            value="last_3_months"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Últimos 3 meses
          </ToggleGroupItem>
          <ToggleGroupItem
            value="last_6_months"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Últimos 6 meses
          </ToggleGroupItem>
          <ToggleGroupItem
            value="current_year"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Ano atual
          </ToggleGroupItem>
          <ToggleGroupItem
            value="last_year"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Ano anterior
          </ToggleGroupItem>
          <ToggleGroupItem
            value="always"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Sempre
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Profissional
        </span>
        <ToggleGroup
          type="single"
          value={doctorFilter}
          onValueChange={(v) => v && setDoctorFilter(v as any)}
          className="justify-start gap-2"
        >
          <ToggleGroupItem
            value="todos"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Dr. Maykow"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Dr. Maykow
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Dra. Ana Cláudia"
            className="text-xs rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Dra. Ana Cláudia
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
