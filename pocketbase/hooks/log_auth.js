routerAdd(
  'POST',
  '/backend/v1/log-auth',
  (e) => {
    const body = e.requestInfo().body
    const user = e.auth?.id
    if (!user) return e.json(200, { success: true })

    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditCol)
      audit.set('user', user)
      audit.set('action', body.action === 'login' ? 'login' : 'logout')
      audit.set('entity', 'users')
      audit.set('details', { ip: e.request.remoteAddr })
      $app.saveNoValidate(audit)
    } catch (err) {
      console.log('Auth log error:', err.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
