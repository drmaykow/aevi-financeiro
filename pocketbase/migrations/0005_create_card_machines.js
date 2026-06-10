migrate(
  (app) => {
    const machines = new Collection({
      name: 'card_machines',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'fees', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(machines)

    const trans = app.findCollectionByNameOrId('transactions')
    trans.fields.add(
      new RelationField({
        name: 'card_machine',
        collectionId: machines.id,
        cascadeDelete: false,
        maxSelect: 1,
      }),
    )
    app.save(trans)
  },
  (app) => {
    const trans = app.findCollectionByNameOrId('transactions')
    trans.fields.removeByName('card_machine')
    app.save(trans)

    const machines = app.findCollectionByNameOrId('card_machines')
    app.delete(machines)
  },
)
