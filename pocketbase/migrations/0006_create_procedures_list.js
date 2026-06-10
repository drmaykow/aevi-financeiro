migrate(
  (app) => {
    const procedures = new Collection({
      name: 'procedures_list',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'doctor',
          type: 'select',
          values: ['Dr. Maykow', 'Dra. Ana Cláudia'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'category',
          type: 'select',
          values: ['CONSULTAS', 'DIU', 'IMPLANON', 'PROCEDIMENTOS'],
          maxSelect: 1,
          required: true,
        },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(procedures)
  },
  (app) => {
    const procedures = app.findCollectionByNameOrId('procedures_list')
    app.delete(procedures)
  },
)
