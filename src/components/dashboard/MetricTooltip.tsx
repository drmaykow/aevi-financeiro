import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function MetricTooltip({ what, how, why }: { what: string; how: string; why: string }) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex outline-none ml-2 shrink-0">
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="end"
        className="bg-gray-900 text-white text-sm rounded-xl max-w-[280px] p-4 space-y-3 border-none shadow-xl z-50"
      >
        <div>
          <span className="font-semibold text-gray-300 block mb-0.5 text-xs uppercase tracking-wider">
            O que é
          </span>
          <p className="leading-snug">{what}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-300 block mb-0.5 text-xs uppercase tracking-wider">
            Como calculamos
          </span>
          <p className="leading-snug">{how}</p>
        </div>
        <div>
          <span className="font-semibold text-gray-300 block mb-0.5 text-xs uppercase tracking-wider">
            Por que importa
          </span>
          <p className="leading-snug">{why}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
