const records = (req, res) => {
  let {limit_hour,start_date,end_date} = req.query;

  let date_sql_query = "",
      purchase_date_sql_query = "",
      payment_date_sql_query = "",
      product_quantity_date_sql_query = "";
  if(isNumeric(limit_hour)) {
    limit_hour = limit_hour * 60;
    purchase_date_sql_query = ` WHERE (purchase.[ins_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE()) OR
                                  purchase.[upd_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE())) `;
    date_sql_query = ` WHERE ([ins_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE()) OR
                                  [upd_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE())) `;
    payment_date_sql_query = ` WHERE ([ins_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE()) OR
                                  [upd_date] > DATEADD(MINUTE, -${limit_hour}, GETDATE())) `;
    product_quantity_date_sql_query = ` AND [tarix] > DATEADD(MINUTE, -${limit_hour}, GETDATE()) `;
  } else if(start_date && end_date) {
    purchase_date_sql_query = ` WHERE ((purchase.[ins_date] >= @start_date AND purchase.[ins_date] <= @end_date) OR
                                  (purchase.[upd_date] >= @start_date AND purchase.[upd_date] <= @end_date)) `;
    date_sql_query = ` WHERE (([ins_date] >= @start_date AND [ins_date] <= @end_date) OR
                                  ([upd_date] >= @start_date AND [upd_date] <= @end_date)) `;
    payment_date_sql_query = ` WHERE (([ins_date] >= @start_date AND [ins_date] <= @end_date) OR
                                  ([upd_date] >= @start_date AND [upd_date] <= @end_date)) `;
    product_quantity_date_sql_query = ` AND ([tarix] >= @start_date AND [tarix] <= @end_date) `;
  }


  const sale_query = `SELECT
                          sale.[id] as id,
                          sale.[code] as code,
                          sale.[operation_date] as operation_date,
                          sale.[customer_id] as customer_id,
                          sale.[customer_name] as customer_name,
                          sale.[currency] as currency,
                          sale.[seller] as seller,
                          sale.[warehouse_id] as warehouse_id,

                          sale.[count] as count,
                          sale.[per_price] as per_price,
                          sale.[total_price] as total_price,
                          sale.[total_price_with_tax] as total_price_with_tax,
                          sale.[comment] as comment,
                          sale.[product_id] as product_id,
                          sale.[product_name] as product_name,

                          sale.[OEM] as OEM,
                          sale.[type] as type,
                          sale.[payment_type] as payment_type,


                          product.[serial] as product_code,

                          product_group.[idn] as product_group_id,
                          product_group.[name] as product_group_name,

                          product_type.[idn] as product_type_id,
                          product_type.[name] as product_type_name,


                          warehouse.[name] as warehouse,
                          branch.[name] as branch,
                          branch.[idn] as branch_id
                        FROM (
                          (SELECT
                              sale.[idn] as id,
                              sale.[sen_no] as code,
                              sale.[ins_date] as operation_date,
                              sale.[kontra] as customer_id,
                              sale.[kontra_name] as customer_name,
                              sale.[valyuta] as currency,
                              sale.[ins_user] as seller,
                              sale.[anbar] as warehouse_id,
                              sale.[nov] as payment_type,

                              sale_detail.[miqdar] as count,
                              sale_detail.[qiymet] as per_price,
                              sale_detail.[mebleg] as total_price,
                              sale_detail.[yekun] as total_price_with_tax,
                              sale_detail.[qeyd] as comment,
                              sale_detail.[mal] as product_id,
                              LTRIM(RTRIM(sale_detail.[el_name])) as product_name,

                              CASE WHEN sale_detail.[org_kod] IS NOT NULL AND LTRIM(RTRIM(sale_detail.[org_kod])) != ''
                                  THEN LTRIM(RTRIM(sale_detail.[org_kod])) ELSE NULL END as OEM,
                              'sale' as type
                          FROM ${table_name("sale_details")} sale_detail
                          LEFT JOIN ${table_name("sales")} sale ON sale.[idn] = sale_detail.[es_no]
                          ${date_sql_query}
                          )
                          UNION ALL
                          (SELECT
                              sale.[idn] as id,
                              sale.[sen_no] as code,
                              sale.[ins_date] as operation_date,
                              sale.[kontra] as customer_id,
                              sale.[kontra_name] as customer_name,
                              sale.[valyuta] as currency,
                              sale.[ins_user] as seller,
                              sale.[anbar] as warehouse_id,
                              sale.[nov] as payment_type,

                              sale_detail.[miqdar] as count,
                              sale_detail.[qiymet] as per_price,
                              sale_detail.[mebleg] as total_price,
                              sale_detail.[yekun] as total_price_with_tax,
                              sale_detail.[qeyd] as comment,
                              sale_detail.[mal] as product_id,
                              LTRIM(RTRIM(sale_detail.[el_name])) as product_name,

                              CASE WHEN sale_detail.[org_kod] IS NOT NULL AND LTRIM(RTRIM(sale_detail.[org_kod])) != ''
                                  THEN LTRIM(RTRIM(sale_detail.[org_kod])) ELSE NULL END as OEM,
                              'return' as type
                          FROM ${table_name("sale_return_details")} sale_detail
                          LEFT JOIN ${table_name("sale_returns")} sale ON sale.[idn] = sale_detail.[es_no]
                          ${date_sql_query})
                        ) as sale
                        LEFT JOIN ${table_name("products")} product ON product.[idn] = sale.[product_id]
                        LEFT JOIN ${table_name("product_groups")} product_group ON product_group.[idn] = product.[qrup]
                        LEFT JOIN ${table_name("product_types")} product_type ON product_type.[idn] = product.[class]
                        LEFT JOIN ${table_name("warehouses")} warehouse ON warehouse.[idn] = sale.[warehouse_id]
                        LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = warehouse.[branch]
                        ORDER BY sale.[operation_date] ASC`;
  const purchase_query = `SELECT
                              purchase.[idn] as id,
                              purchase.[sen_no] as code,
                              purchase.[ins_date] as operation_date,
                              purchase.[kontra] as customer_id,
                              purchase.[kon_name] as customer_name,
                              purchase.[valyuta] as currency,
                              purchase.[ins_user] as operator,

                              purchase_detail.[miqdar] as count,
                              purchase_detail.[qiymet] as per_price,
                              purchase_detail.[son_qiy] as per_price_in_local_currency,
                              purchase_detail.[mebleg] as total_price,
                              purchase_detail.[yekun] as total_price_with_tax,
                              purchase_detail.[son_meb] as total_price_in_local_currency,
                              purchase_detail.[xerc_meb] as extra_cost,
                              purchase_detail.[qeyd] as comment,
                              purchase_detail.[mal] as product_id,
                              LTRIM(RTRIM(purchase_detail.[el_name])) as product_name,

                              product_group.[idn] as product_group_id,
                              product_group.[name] as product_group_name,

                              product_type.[idn] as product_type_id,
                              product_type.[name] as product_type_name,


                              product.[serial] as product_code,

                              warehouse.[name] as warehouse,
                              purchase.[anbar] as warehouse_id,
                              branch.[name] as branch,
                              branch.[idn] as branch_id,
                              CASE WHEN purchase_detail.[org_kod] IS NOT NULL AND LTRIM(RTRIM(purchase_detail.[org_kod])) != ''
                                      THEN LTRIM(RTRIM(purchase_detail.[org_kod])) ELSE NULL END as OEM

                            FROM ${table_name("purchase_details")} purchase_detail
                            LEFT JOIN ${table_name("purchases")} purchase ON purchase.[idn] = purchase_detail.[es_no]
                            LEFT JOIN ${table_name("products")} product ON product.[idn] = purchase_detail.[mal]
                            LEFT JOIN ${table_name("product_groups")} product_group ON product_group.[idn] = product.[qrup]
                            LEFT JOIN ${table_name("product_types")} product_type ON product_type.[idn] = product.[class]
                            LEFT JOIN ${table_name("warehouses")} warehouse ON warehouse.[idn] = purchase.[anbar]
                            LEFT JOIN ${table_name("customers")} customer ON customer.[idn] = purchase.[kontra]
                            LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = warehouse.[branch]
                            ${purchase_date_sql_query}
                            ORDER BY purchase.[ins_date] ASC, purchase.[idn] ASC`;
  const payment_query = `SELECT
                            payment.[idn] as id,
                            payment.[sen_no] as code,
                            payment.[tarix] as operation_date,
                            payment.[mezmun] as description,
                            payment.[valyuta] as currency,
                            payment.[kurs] as currency_value,
                            CASE WHEN [type] = 'exit' THEN payment.[yekun] ELSE NULL END as exit_amount,
                            CASE WHEN [type] = 'entry' THEN payment.[yekun] ELSE NULL END as entry_amount,
                            branch.[name] as branch_name,
                            payment.[sobe] as branch_id,
                            payment.[kassa] as cashbox_id,
                            cashbox.[name] as cashbox,
                            type.[name] as type_name,
                            payment.[nov] as type,
                            payment.[kontra] as customer_id,
                            payment.[kon_name] as customer
                          FROM (
                          (SELECT
                              [idn],
                              [sen_no],
                              [tarix],
                              [mezmun],
                              [valyuta],
                              [kurs],
                              [yekun],
                              [sobe],
                              [kassa],
                              [nov],
                              [kontra],
                              [kon_name],
                              'exit' as type
                          FROM ${table_name("exit_payments")}

                          ${payment_date_sql_query})
                          UNION ALL
                          (SELECT
                            [idn],
                            [sen_no],
                            [tarix],
                            [mezmun],
                            [valyuta],
                            [kurs],
                            [yekun],
                            [sobe],
                            [kassa],
                            [nov],
                            [kontra],
                            [kon_name],
                            'entry' as type
                          FROM ${table_name("entry_payments")}

                          ${payment_date_sql_query})
                          ) payment
                          LEFT JOIN ${table_name("cashbox")} cashbox ON cashbox.[idn] = payment.[kassa]
                          LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = payment.[sobe]
                          LEFT JOIN ${table_name("payment_types")} type ON type.[idn] = payment.[nov]
                          ORDER BY payment.[tarix] ASC`;
  const product_quantity_query = `SELECT
                                    product.[idn] as [product_id],
                                    quantities.[warehouse_id] as warehouse_id,
                                    quantities.[amount] as quantity
                                  FROM ${table_name("products")} product
                                  OUTER APPLY (SELECT
                                                  (SELECT SUM([miqdar] - [say_sil])
                                                    FROM ${table_name("product_quantities")}
                                                    WHERE [mal] = product.[idn]
                                                    AND [anbar] = warehouse.[idn]) as amount,
                                                    warehouse.[idn] as warehouse_id
                                              FROM ${table_name("warehouses")} as warehouse) quantities
                                  WHERE (
                                    SELECT COUNT(1)
                                    FROM ${table_name("product_quantities")}
                                    WHERE [mal] = product.[idn]
                                    ${product_quantity_date_sql_query}
                                  ) > 0`;
  sql_connect.then(pool => {
    return pool.request()
        .input('start_date', sql.Date, start_date)
        .input('end_date', sql.Date, end_date)
        .query(`${sale_query}; ${purchase_query}; ${payment_query}; ${product_quantity_query}`)
    }).then(result => {

      result.recordsets[0].map((v,index) => {
        result.recordsets[0][index]['operation_date'] = (new Date(v.operation_date)).toISOString().replace(/T/, ' ').    replace(/\..+/, '');
      });

      result.recordsets[1].map((v,index) => {
        result.recordsets[1][index]['operation_date'] = (new Date(v.operation_date)).toISOString().replace(/T/, ' ').    replace(/\..+/, '');
      });

      result.recordsets[2].map((v,index) => {
        result.recordsets[2][index]['operation_date'] = (new Date(v.operation_date)).toISOString().replace(/T/, ' ').    replace(/\..+/, '');
      });


        const all_list = {
          sales: result.recordsets[0],
          purchases: result.recordsets[1],
          payments: result.recordsets[2],
          product_quantities: result.recordsets[3]
        };
        res.status(200).json(rest_response(200,"Success",all_list))
    }).catch(err => {
      console.log(err);
      res.status(200).json(rest_response(500,"Internal server error"))
    });



}


module.exports = {
  records
}
