migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')

    col.fields.add(
      new SelectField({
        name: 'entry_type',
        values: ['CONSULTA/PROCEDIMENTO', 'TAXA DE AGENDAMENTO'],
        maxSelect: 1,
      }),
    )

    col.fields.add(
      new SelectField({
        name: 'category',
        values: [
          'ALUGUEL',
          'LUZ',
          'INTERNET',
          'MARKETING',
          'CONDOMINIO',
          'MATERIAL E INSUMO',
          'CONTADOR',
          'IMPOSTOS/TAXAS',
          'SECRETARIA',
          'ESTORNO DE TAXA',
          'OUTRO',
          'Consulta',
          'Procedimento',
          'Exame',
          'Outros',
          'Aluguel',
          'Suprimentos',
          'Folha de Pagamento',
        ],
        maxSelect: 1,
      }),
    )

    if (!col.fields.getByName('is_recurring')) {
      col.fields.add(new BoolField({ name: 'is_recurring' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')

    col.fields.add(
      new SelectField({
        name: 'entry_type',
        values: ['CONSULTA/PROCEDIMENTO', 'TAXA DE AGENDAMENTO', 'ESTORNO DE TAXA'],
        maxSelect: 1,
      }),
    )

    col.fields.add(
      new SelectField({
        name: 'category',
        values: [
          'ALUGUEL',
          'CONTA FIXA',
          'MATERIAL E INSUMO',
          'OUTRO',
          'ESTORNO DE TAXA',
          'Consulta',
          'Procedimento',
          'Exame',
          'Outros',
          'Aluguel',
          'Suprimentos',
          'Folha de Pagamento',
          'Marketing',
        ],
        maxSelect: 1,
      }),
    )

    if (col.fields.getByName('is_recurring')) {
      col.fields.removeByName('is_recurring')
    }

    app.save(col)
  },
)
