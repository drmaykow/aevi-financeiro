migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = "@request.auth.role = 'medico' || id = @request.auth.id"
    users.viewRule = "@request.auth.role = 'medico' || id = @request.auth.id"
    users.deleteRule = "@request.auth.role = 'medico' || id = @request.auth.id"
    app.save(users)

    const procedures = app.findCollectionByNameOrId('procedures_list')
    try {
      app.findFirstRecordByData('procedures_list', 'name', 'Pacote DIU Hormonal')
    } catch (_) {
      const record = new Record(procedures)
      record.set('name', 'Pacote DIU Hormonal')
      record.set('doctor', 'Dra. Ana Cláudia')
      record.set('category', 'PROCEDIMENTOS')
      record.set('active', true)
      app.save(record)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
