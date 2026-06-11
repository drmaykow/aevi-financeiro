migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('procedures_list')

    const record1 = new Record(collection)
    record1.set('name', 'Pacote DIU Hormonal')
    record1.set('category', 'DIU')
    record1.set('doctor', 'Dra. Ana Cláudia')
    record1.set('active', true)
    app.save(record1)

    const record2 = new Record(collection)
    record2.set('name', 'Pacote DIU Hormonal')
    record2.set('category', 'DIU')
    record2.set('doctor', 'Dr. Maykow')
    record2.set('active', true)
    app.save(record2)
  },
  (app) => {
    const records = app.findRecordsByFilter(
      'procedures_list',
      "name = 'Pacote DIU Hormonal' && category = 'DIU'",
      '',
      100,
      0,
    )
    for (let record of records) {
      app.delete(record)
    }
  },
)
