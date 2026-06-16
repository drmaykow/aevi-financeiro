import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'

export const getDateFilter = (preset: string) => {
  const now = new Date()
  let start: Date
  let end: Date = endOfMonth(now)

  switch (preset) {
    case 'Mês atual':
      start = startOfMonth(now)
      break
    case 'Mês anterior':
      start = startOfMonth(subMonths(now, 1))
      end = endOfMonth(subMonths(now, 1))
      break
    case 'Últimos 3 meses':
      start = startOfMonth(subMonths(now, 3))
      break
    case 'Últimos 6 meses':
      start = startOfMonth(subMonths(now, 6))
      break
    case 'Ano atual':
      start = startOfYear(now)
      end = endOfYear(now)
      break
    case 'Sempre':
    default:
      return ''
  }

  return `date >= "${start.toISOString()}" && date <= "${end.toISOString()}"`
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
