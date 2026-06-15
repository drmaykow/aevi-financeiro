import pb from '@/lib/pocketbase/client'

export interface AuditLog {
  id: string
  user: string
  action: string
  entity: string
  details: any
  created: string
  updated: string
  expand?: {
    user?: {
      id: string
      name: string
      email: string
    }
  }
}

export const getAuditLogs = async (
  page: number,
  perPage: number,
  filter?: string,
  sort?: string,
) => {
  return pb.collection('audit_logs').getList<AuditLog>(page, perPage, {
    filter,
    sort: sort || '-created',
    expand: 'user',
  })
}
