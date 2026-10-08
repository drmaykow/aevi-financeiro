const TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna ano, mês (1-12) e dia atuais ancorados no fuso horário especificado.
 */
function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = formatter.formatToParts(date)
  const map: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10)
    }
  }
  return {
    year: map.year,
    month: map.month, // 1-12
    day: map.day,
  }
}

/**
 * Converte um instante de data e hora em Brasília (ano, mês 1-12, dia, hora, minuto, segundo, ms)
 * para a string ISO UTC equivalente ("YYYY-MM-DDTHH:mm:ss.sssZ").
 */
function getUtcIsoForSaoPaulo(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
): string {
  // Cria uma aproximação assumindo UTC-3 (fuso padrão de São Paulo sem horário de verão)
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const padMs = (n: number) => String(n).padStart(3, '0')
  const targetIsoLocal = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(ms)}`

  // Itera convergindo para o instante UTC exato que projeta no target em America/Sao_Paulo
  let guessTime = Date.UTC(year, month - 1, day, hours + 3, minutes, seconds, ms)

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  // Ajuste de fuso caso haja alguma diferença histórica/DST
  for (let i = 0; i < 3; i++) {
    const parts = dtf.formatToParts(new Date(guessTime))
    const m: Record<string, string> = {}
    for (const p of parts) {
      if (p.type !== 'literal') m[p.type] = p.value
    }
    const currentIsoLocal = `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}.${padMs(ms)}`
    if (currentIsoLocal === targetIsoLocal) break
    const diffMs =
      new Date(targetIsoLocal + 'Z').getTime() - new Date(currentIsoLocal + 'Z').getTime()
    guessTime += diffMs
  }

  return new Date(guessTime).toISOString()
}

/**
 * Retorna o último dia de um determinado mês em um determinado ano.
 */
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Subtrai N meses de um ano/mês (1-12).
 */
function subtractMonths(
  year: number,
  month: number,
  count: number,
): { year: number; month: number } {
  let targetMonth = month - count
  let targetYear = year
  while (targetMonth < 1) {
    targetMonth += 12
    targetYear -= 1
  }
  return { year: targetYear, month: targetMonth }
}

export const getDateFilter = (preset: string) => {
  const now = new Date()
  const { year: currentYear, month: currentMonth } = getZonedParts(now, TIMEZONE)

  let startIso: string
  let endIso: string = getUtcIsoForSaoPaulo(
    currentYear,
    currentMonth,
    getLastDayOfMonth(currentYear, currentMonth),
    23,
    59,
    59,
    999,
  )

  switch (preset) {
    case 'Mês atual':
      startIso = getUtcIsoForSaoPaulo(currentYear, currentMonth, 1, 0, 0, 0, 0)
      break
    case 'Mês anterior': {
      const prev = subtractMonths(currentYear, currentMonth, 1)
      startIso = getUtcIsoForSaoPaulo(prev.year, prev.month, 1, 0, 0, 0, 0)
      endIso = getUtcIsoForSaoPaulo(
        prev.year,
        prev.month,
        getLastDayOfMonth(prev.year, prev.month),
        23,
        59,
        59,
        999,
      )
      break
    }
    case 'Últimos 3 meses': {
      const past = subtractMonths(currentYear, currentMonth, 3)
      startIso = getUtcIsoForSaoPaulo(past.year, past.month, 1, 0, 0, 0, 0)
      break
    }
    case 'Últimos 6 meses': {
      const past = subtractMonths(currentYear, currentMonth, 6)
      startIso = getUtcIsoForSaoPaulo(past.year, past.month, 1, 0, 0, 0, 0)
      break
    }
    case 'Ano atual':
      startIso = getUtcIsoForSaoPaulo(currentYear, 1, 1, 0, 0, 0, 0)
      endIso = getUtcIsoForSaoPaulo(currentYear, 12, 31, 23, 59, 59, 999)
      break
    case 'Sempre':
    default:
      return ''
  }

  return `date >= "${startIso}" && date <= "${endIso}"`
}

export const generatePagination = (currentPage: number, totalPages: number) => {
  const delta = 2
  const range = []
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i)
  }

  if (currentPage - delta > 2) {
    range.unshift('...')
  }
  if (currentPage + delta < totalPages - 1) {
    range.push('...')
  }

  range.unshift(1)
  if (totalPages > 1) {
    range.push(totalPages)
  }

  return range
}
