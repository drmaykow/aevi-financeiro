migrate(
  (app) => {
    const collection = new Collection({
      name: 'transactions',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'medico' || @request.auth.role = 'secretaria')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'medico' || @request.auth.role = 'secretaria')",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'medico' || @request.auth.role = 'secretaria')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'medico' || @request.auth.role = 'secretaria')",
      deleteRule:
        "@request.auth.id != '' && (@request.auth.role = 'medico' || @request.auth.role = 'secretaria')",
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'type', type: 'select', values: ['entry', 'exit'], maxSelect: 1, required: true },
        { name: 'doctor', type: 'text' },
        { name: 'amount', type: 'number', required: true, min: 0 },
        {
          name: 'payment_method',
          type: 'select',
          values: ['PIX', 'DINHEIRO', 'CARTÃO DE CRÉDITO'],
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'select',
          values: ['ALUGUEL', 'CONTA FIXA', 'MATERIAL E INSUMO', 'OUTRO'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')
    app.delete(collection)
  },
)
