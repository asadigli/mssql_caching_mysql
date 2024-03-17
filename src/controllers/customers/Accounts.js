const allAccounts = (req, res) => {
  let {limit_hour, start_date, end_date} = req.query;
  end_date = end_date ? new Date(end_date) : null;
  start_date = start_date ? new Date(start_date) : null;



  let date_sql_query = "";
  if(isNumeric(limit_hour)) {
    limit_hour = limit_hour * 60;
    date_sql_query = ` AND ([tarix] > DATEADD(MINUTE, -${limit_hour}, GETDATE()) OR
                                  [upd_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE())) `;
  }

  if(start_date && end_date) {
    date_sql_query =  ` AND (([tarix] >= @start_date AND [tarix] <= @end_date)
                                OR ([upd_date] >= @start_date AND [upd_date] <= @end_date)) `;
  }


    sql_connect.then(pool => {
      return pool.request()
          .input('start_date', sql.Date, start_date)
          .input('end_date', sql.Date, end_date)
          .query(`SELECT  *
          FROM ((SELECT
          [idn] as id,
          NULL as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          [ins_user] as ins_user,
          [upd_user] as upd_user,
          'sale' as [type],
          'buyer' as [customer_type],
          CASE WHEN [nov] = '1' THEN [tam_yek] ELSE NULL END as entry_amount,
          CASE WHEN [nov] = '0' THEN [tam_yek] ELSE NULL END  as exit_amount,
          [serh] as comment,
          '0' as is_cash,
          [kontra_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("sales")}
          WHERE [tam_yek] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (SELECT
          [idn] as id,
          [kassa] as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as ins_user,
          NULL as upd_user,
          'sale_payment' as [type],
          'buyer' as [customer_type],
          CASE WHEN [nov] = '1' THEN [nagd_mebleg] ELSE NULL END as entry_amount,
          CASE WHEN [nov] = '0' THEN [nagd_mebleg] ELSE NULL END as exit_amount,
          [serh] as comment,
          '1' as is_cash,
          [kontra_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("sales")}
          WHERE [nagd_mebleg] != 0
          AND [yekun] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          payment_exits.[idn] as id,
          [kassa] as [cashbox_id],
          payment_exits.[sen_no] as code,
          payment_exits.[tarix] as [date],
          payment_exits.[upd_date] as [update_date],
          payment_exits.[kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'payment_exit' as [type],
          'supplier' as [customer_type],
          payment_exits.[yekun] / payment_exits.[kon_kurs] as entry_amount,
          NULL as exit_amount,
          payment_exits.[mezmun] as comment,
          '1' as is_cash,
          payment_exits.[kon_name] as customer,
          payment_exits.[kon_val] as currency,
          payment_exits.[kon_kurs] as currency_value
          FROM ${table_name("exit_payments")} payment_exits
          WHERE payment_exits.[nov] != 2
          AND payment_exits.[mux] = 1
           AND payment_exits.[nov] != 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          [idn] as id,
          [kassa] as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'payment_entry' as [type],
          'buyer' as [customer_type],
          NULL as entry_amount,
          [mebleg] as exit_amount,
          [mezmun] as comment,
          '1' as is_cash,
          [kon_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("entry_payments")}
          WHERE 1 > 0
          AND [nov] != 1
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          [idn] as id,
          NULL as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'sale_return' as [type],
          'buyer' as [customer_type],
          NULL  as entry_amount,
          [tam_yek] as exit_amount,
          [serh] as comment,
          '0' as is_cash,
          [kontra_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("sale_returns")}
          WHERE [tam_yek] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          [idn] as id,
          [kassa] as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'sale_return_payment' as [type],
          'buyer' as [customer_type],
          CASE WHEN [nov] = '1' THEN [nagd_mebleg] ELSE NULL END as entry_amount,
          CASE WHEN [nov] = '0' THEN [nagd_mebleg] ELSE NULL END as exit_amount,
          [serh] as comment,
          '1' as is_cash,
          [kontra_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("sale_returns")}
          WHERE [mv_yek] IS NOT NULL
          AND [nagd_mebleg] != 0
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          [idn] as id,
          NULL as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          (CASE
            WHEN [nov] = '0' THEN 'debt_left'
            ELSE 'debt_given' END) as [type],
          'buyer' as [customer_type],
          CASE WHEN [nov] = '0' THEN [mebleg] ELSE NULL END as entry_amount,
          CASE WHEN [nov] = '1' THEN [mebleg] ELSE NULL END as exit_amount,
          [serh] as comment,
          '0' as is_cash,
          [kon_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("customer_debt")}
          WHERE [mebleg] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (
          SELECT
          [idn] as id,
          NULL as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'purchase' as [type],
          'supplier' as [customer_type],
          NULL as entry_amount,
          [tam_yek] as exit_amount,
          [serh] as comment,
          '0' as is_cash,
          [kon_name] as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("purchases")}
          WHERE [yekun] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          ) UNION ALL (

            SELECT
            [idn] as id,
            NULL as [cashbox_id],
            [sen_no] as code,
            [tarix] as [date],
            [upd_date] as [update_date],
            [kontra] as customer_id,
            NULL as [ins_user],
          NULL as [upd_user],
            'service_purchase' as [type],
            'supplier' as [customer_type],
            NULL as entry_amount,
            [yekun] as exit_amount,
            [serh] as comment,
            '0' as is_cash,
            [kontra_name] as customer,
            [valyuta] as currency,
            [kurs] as currency_value
            FROM ${table_name("service_purchases")}
            WHERE [yekun] IS NOT NULL
            AND [mux] = 1
            ${date_sql_query}

            ) UNION ALL (
          SELECT
          purchase_expenses.[idn] as id,
          NULL as [cashbox_id],
          purchases.[sen_no] as code,
          purchases.[tarix] as [date],
          NULL as [update_date],
          purchase_expenses.[kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'purchase_expense' as [type],
          'supplier' as [customer_type],
          NULL as entry_amount,
          purchase_expenses.[val_meb] as exit_amount,
          NULL as comment,
          '0' as is_cash,
          NULL as customer,
          purchase_expenses.[valyuta] as currency,
          purchase_expenses.[kurs] as currency_value
          FROM ${table_name("purchase_expenses")} purchase_expenses
          LEFT JOIN ${table_name("purchases")} purchases ON purchases.[idn] = purchase_expenses.[es_no]

          ) UNION ALL (
          SELECT
          [idn] as id,
          NULL as [cashbox_id],
          [sen_no] as code,
          [tarix] as [date],
          [upd_date] as [update_date],
          [kontra] as customer_id,
          NULL as [ins_user],
          NULL as [upd_user],
          'purchase_return' as [type],
          'supplier' as [customer_type],
          [tam_yek] as entry_amount,
          NULL as exit_amount,
          [serh] as comment,
          '0' as is_cash,
          NULL as customer,
          [valyuta] as currency,
          [kurs] as currency_value
          FROM ${table_name("purchase_returns")}
          WHERE [tam_yek] IS NOT NULL
          AND [mux] = 1
          ${date_sql_query}
          )) as sub_query

          ORDER BY [date],[id] ASC`)
      }).then(result => {
        const all_list = result.recordset;
        all_list.map((v,index) => {
          let date = new Date(v.date);
          let update_date = new Date(v.update_date);
          all_list[index]['update_date'] = (update_date).toISOString().replace(/T/, ' ').replace(/\..+/, '');
          all_list[index]['date'] = (date).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        })

        return  res.status(200).json(rest_response(200,"Success",all_list))
      }).catch(err => {
        console.log(err);
      });

}



module.exports = {
  allAccounts
}
