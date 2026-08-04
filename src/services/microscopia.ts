import pb from '@/lib/pocketbase/client'
import type { TransactionRecord } from '@/services/transactions'

export interface MicroscopiaRecord {
  id: string
  date: string
  patient: string
  procedures: string[] | null
}

export interface PatientMicroscopia {
  patient: string
  records: MicroscopiaRecord[]
  totalCount: number
  cycleCount: number
  lastDate: string
  lastProcedureDate: string
  daysSinceLastProcedure: number
}

const CUTOFF_DATE = new Date('2026-08-05T00:00:00.000Z')
const RELEVANT_PROCEDURES = ['Microscopia', 'Seguimento', 'Primeira consulta']

function hasProcedure(tx: TransactionRecord, procedureName: string): boolean {
  if (tx.type !== 'entry') return false
  if (!tx.procedures || !Array.isArray(tx.procedures)) return false
  return tx.procedures.includes(procedureName)
}

function hasAnyRelevantProcedure(tx: TransactionRecord): boolean {
  return RELEVANT_PROCEDURES.some((p) => hasProcedure(tx, p))
}

export async function getMicroscopiaPatients(): Promise<PatientMicroscopia[]> {
  const allEntries = await pb.collection('transactions').getFullList<TransactionRecord>({
    filter: 'type = "entry"',
    sort: 'date',
  })

  const filteredEntries = allEntries.filter((tx) => new Date(tx.date) >= CUTOFF_DATE)

  const patientsWithMicroscopia = new Set<string>()
  for (const tx of filteredEntries) {
    if (hasProcedure(tx, 'Microscopia')) {
      const name = (tx.patient || '').trim()
      if (name) patientsWithMicroscopia.add(name)
    }
  }

  const grouped = new Map<string, MicroscopiaRecord[]>()

  for (const tx of filteredEntries) {
    if (!hasAnyRelevantProcedure(tx)) continue
    const patientName = (tx.patient || 'Desconhecido').trim()
    if (!patientName || patientName === 'Desconhecido') continue
    if (!patientsWithMicroscopia.has(patientName)) continue

    const record: MicroscopiaRecord = {
      id: tx.id!,
      date: tx.date,
      patient: patientName,
      procedures: Array.isArray(tx.procedures) ? tx.procedures : null,
    }

    if (!grouped.has(patientName)) {
      grouped.set(patientName, [])
    }
    grouped.get(patientName)!.push(record)
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const patients: PatientMicroscopia[] = []

  for (const [patientName, records] of grouped) {
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const totalCount = records.filter((r) => r.procedures?.includes('Microscopia')).length

    let cycleCount = 0
    for (const record of records) {
      const procs = record.procedures || []
      const isIsolatedMicroscopia = procs.length === 1 && procs[0] === 'Microscopia'
      const hasMicroscopia = procs.includes('Microscopia')
      const hasSeguimento = procs.includes('Seguimento')
      const hasPrimeiraConsulta = procs.includes('Primeira consulta')

      if (isIsolatedMicroscopia) {
        cycleCount += 1
      } else if (hasMicroscopia && (hasSeguimento || hasPrimeiraConsulta)) {
        cycleCount = 0
      }
    }

    const lastProcedureDate = records[records.length - 1].date
    const lastProcDate = new Date(lastProcedureDate)
    lastProcDate.setHours(0, 0, 0, 0)
    const daysSinceLastProcedure = Math.floor(
      (now.getTime() - lastProcDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    const microscopiaRecords = records.filter((r) => r.procedures?.includes('Microscopia'))
    const lastDate =
      microscopiaRecords.length > 0
        ? microscopiaRecords[microscopiaRecords.length - 1].date
        : records[records.length - 1].date

    patients.push({
      patient: patientName,
      records,
      totalCount,
      cycleCount,
      lastDate,
      lastProcedureDate,
      daysSinceLastProcedure,
    })
  }

  patients.sort((a, b) => a.patient.localeCompare(b.patient))

  return patients
}
