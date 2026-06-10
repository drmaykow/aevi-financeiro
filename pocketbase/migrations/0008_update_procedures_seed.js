/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('procedures_list')
    app.db().newQuery('DELETE FROM procedures_list').execute()

    const doctors = ['Dr. Maykow', 'Dra. Ana Cláudia']
    const procedures = [
      { cat: 'CONSULTAS', names: ['Primeira consulta', 'Seguimento'] },
      {
        cat: 'DIU',
        names: [
          'Inserção DIU cobre',
          'Pacote DIU cobre',
          'Pacote DIU cobre e prata',
          'Inserção DIU hormonal',
          'Retirada DIU',
        ],
      },
      { cat: 'IMPLANON', names: ['Inserção Implanon', 'Pacote Implanon', 'Retirada Implanon'] },
      { cat: 'PROCEDIMENTOS', names: ['Colposcopia', 'Microscopia', 'CAF', 'Laser'] },
    ]

    for (const doc of doctors) {
      for (const group of procedures) {
        for (const name of group.names) {
          const record = new Record(col)
          record.set('name', name)
          record.set('doctor', doc)
          record.set('category', group.cat)
          record.set('active', true)
          app.save(record)
        }
      }
    }

    const cardMachinesCol = app.findCollectionByNameOrId('card_machines')
    try {
      app.findFirstRecordByData('card_machines', 'name', 'Maquininha Principal')
    } catch (_) {
      const record = new Record(cardMachinesCol)
      record.set('name', 'Maquininha Principal')
      const fees = {}
      for (let i = 1; i <= 12; i++) fees[i] = 0
      record.set('fees', fees)
      app.save(record)
    }
  },
  (app) => {},
)
