migrate(
  (app) => {
    const machines = app.findCollectionByNameOrId('card_machines')
    try {
      app.findFirstRecordByData('card_machines', 'name', 'Maquininha Principal')
    } catch (_) {
      const record = new Record(machines)
      record.set('name', 'Maquininha Principal')
      record.set('fees', {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
      })
      app.save(record)
    }

    const procedures = app.findCollectionByNameOrId('procedures_list')
    const doctors = ['Dr. Maykow', 'Dra. Ana Cláudia']
    const data = [
      { name: 'Primeira consulta', category: 'CONSULTAS' },
      { name: 'Retorno', category: 'CONSULTAS' },
      { name: 'Inserção DIU de Cobre / Pacote', category: 'DIU' },
      { name: 'DIU Hormonal', category: 'DIU' },
      { name: 'Implanon Inserção', category: 'IMPLANON' },
      { name: 'Implanon Pacote', category: 'IMPLANON' },
      { name: 'Implanon Remoção', category: 'IMPLANON' },
      { name: 'Colposcopia', category: 'PROCEDIMENTOS' },
      { name: 'Microscopia', category: 'PROCEDIMENTOS' },
      { name: 'CAF', category: 'PROCEDIMENTOS' },
      { name: 'Laser', category: 'PROCEDIMENTOS' },
    ]

    for (const doc of doctors) {
      for (const item of data) {
        try {
          app.findFirstRecordByFilter(
            'procedures_list',
            `name = '${item.name}' && doctor = '${doc}'`,
          )
        } catch (_) {
          const record = new Record(procedures)
          record.set('name', item.name)
          record.set('category', item.category)
          record.set('doctor', doc)
          record.set('active', true)
          app.save(record)
        }
      }
    }
  },
  (app) => {},
)
