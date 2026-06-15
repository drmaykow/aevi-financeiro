onRecordCreateRequest(
  (e) => {
    e.next()
    try {
      const user = e.auth?.id || null
      if (user) {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const audit = new Record(auditCol)
        audit.set('user', user)
        audit.set('action', 'create')
        audit.set('entity', e.collection.name)
        audit.set('details', e.record.publicExport())
        $app.saveNoValidate(audit)
      }
    } catch (err) {
      console.log('Audit log error:', err.message)
    }
  },
  'users',
  'transactions',
  'card_machines',
  'procedures_list',
)

onRecordUpdateRequest(
  (e) => {
    const before = e.record.original().publicExport()
    e.next()
    try {
      const user = e.auth?.id || null
      if (user) {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const audit = new Record(auditCol)
        audit.set('user', user)
        audit.set('action', 'update')
        audit.set('entity', e.collection.name)
        audit.set('details', {
          before: before,
          after: e.record.publicExport(),
        })
        $app.saveNoValidate(audit)
      }
    } catch (err) {
      console.log('Audit log error:', err.message)
    }
  },
  'users',
  'transactions',
  'card_machines',
  'procedures_list',
)

onRecordDeleteRequest(
  (e) => {
    const details = e.record.publicExport()
    e.next()
    try {
      const user = e.auth?.id || null
      if (user) {
        const auditCol = $app.findCollectionByNameOrId('audit_logs')
        const audit = new Record(auditCol)
        audit.set('user', user)
        audit.set('action', 'delete')
        audit.set('entity', e.collection.name)
        audit.set('details', details)
        $app.saveNoValidate(audit)
      }
    } catch (err) {
      console.log('Audit log error:', err.message)
    }
  },
  'users',
  'transactions',
  'card_machines',
  'procedures_list',
)
