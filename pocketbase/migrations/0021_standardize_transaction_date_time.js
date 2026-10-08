migrate(
  (app) => {
    // Atualizar registros cujo horário esteja às 03:00:00 UTC para 12:00:00 UTC,
    // mantendo exatamente o mesmo dia e formato.
    // Lida tanto com o formato ISO 'YYYY-MM-DD 03:00:00.000Z' quanto 'YYYY-MM-DD 03:00:00.000'.
    app
      .db()
      .newQuery(
        `UPDATE transactions
         SET date = SUBSTR(date, 1, 10) || ' 12:00:00.000Z'
         WHERE date LIKE '%03:00:00%'`,
      )
      .execute()
  },
  (app) => {
    // Reverter de 12:00:00 para 03:00:00 caso necessário
    app
      .db()
      .newQuery(
        `UPDATE transactions
         SET date = SUBSTR(date, 1, 10) || ' 03:00:00.000Z'
         WHERE date LIKE '%12:00:00%'`,
      )
      .execute()
  },
)
