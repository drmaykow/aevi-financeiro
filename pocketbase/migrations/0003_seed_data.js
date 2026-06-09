migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUser = (email, name, role) => {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(email)
        record.setPassword('Skip@Pass123')
        record.setVerified(true)
        record.set('name', name)
        record.set('role', role)
        app.save(record)
      }
    }

    seedUser('maykow@hotmail.com.br', 'Dr. Maykow', 'medico')
    seedUser('ana@clinicaaevi.com.br', 'Dra. Ana Cláudia', 'medico')
    seedUser('secretaria@clinicaaevi.com.br', 'Secretária', 'secretaria')

    const txs = app.findCollectionByNameOrId('transactions')

    try {
      app.findFirstRecordByData('transactions', 'description', 'Seed Tx 1')
    } catch (_) {
      const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

      const t1 = new Record(txs)
      t1.set('date', today)
      t1.set('type', 'entry')
      t1.set('doctor', 'Dr. Maykow')
      t1.set('amount', 250.0)
      t1.set('payment_method', 'PIX')
      t1.set('description', 'Seed Tx 1')
      app.save(t1)

      const t2 = new Record(txs)
      t2.set('date', today)
      t2.set('type', 'exit')
      t2.set('category', 'MATERIAL E INSUMO')
      t2.set('amount', 120.5)
      t2.set('description', 'Seed Tx 2 - Seringas')
      app.save(t2)

      const t3 = new Record(txs)
      t3.set('date', today)
      t3.set('type', 'entry')
      t3.set('doctor', 'Dra. Ana Cláudia')
      t3.set('amount', 300.0)
      t3.set('payment_method', 'CARTÃO DE CRÉDITO')
      t3.set('description', 'Seed Tx 3')
      app.save(t3)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'maykow@hotmail.com.br')
      app.delete(record)
    } catch (_) {}
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'ana@clinicaaevi.com.br')
      app.delete(record)
    } catch (_) {}
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'secretaria@clinicaaevi.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
