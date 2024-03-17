const { verbose } = require("winston");

const payment_history = (req,res) => {
  let {end_date, start_date, cashbox_id, type_id, branch_id} = req.query;
    if (!end_date || !start_date) {
        return res.status(400).json(rest_response(400,"Date cannot be empty"))
    }

    let type_query = "",
        branch_query = "";
    if (type_id && isNumeric(type_id)) {
      type_query = ` AND payment.[nov] = ${type_id} `;
    }

    if (branch_id && isNumeric(branch_id)) {
      branch_query = ` AND payment.[sobe] = ${branch_id} `;
    }
    end_date = new Date(end_date);
    start_date = new Date(start_date);

    end_date.setDate(end_date.getDate() + 1);


    sql_connect.then(pool => {
        // pool.request()
        return pool.request()
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .input('cashbox_id', sql.Int, cashbox_id)
            .query(`SELECT
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
                      FROM ${table_name("exit_payments")})
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
                     FROM ${table_name("entry_payments")})
                    ) payment
                    LEFT JOIN ${table_name("cashbox")} cashbox ON cashbox.[idn] = payment.[kassa]
                    LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = payment.[sobe]
                    LEFT JOIN ${table_name("payment_types")} type ON type.[idn] = payment.[nov]
                    WHERE payment.[tarix] >= @start_date
                    AND payment.[tarix] < @end_date
                    AND payment.[kassa] = @cashbox_id
                    ${type_query}
                    ${branch_query}
                    ORDER BY payment.[tarix], payment.[idn] ASC`)
    }).then(result => {
      const payments = result.recordset;
        if(!payments.length){
            return res.status(200).json(rest_response(204,"Payment not found"))
        }

        payments.map((v,index) => {

          payments[index]["operation_date"] = v.operation_date.toISOString().
          replace(/T/, ' ').
          replace(/\..+/, '');
          payments[index]["left_amount"] = +v.entry_amount - +v.exit_amount;
          payments[index]["cashbox"] = {
            id: v.cashbox_id,
            name: v.cashbox
          }

          payments[index]["branch"] = {
            id: v.branch_id,
            name: v.branch_name
          }

          payments[index]["type"] = {
            id: v.type,
            name: v.type_name
          }

          payments[index]["customer"] = {
            id: v.customer_id,
            name: v.customer
          }

          delete payments[index]["customer_id"];
          delete payments[index]["cashbox_id"];
          delete payments[index]["branch_id"];
          delete payments[index]["branch_name"];
          delete payments[index]["type_name"];
        });


        let details_list = {
            count: payments.length,
            list: payments
        };

        res.status(200).json(rest_response(200,"Success",details_list))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });
}


const paymentsDaily = (req,res) => {
  let {end_date, start_date, cashbox_id, type_id, branch_id} = req.query;
    if (!end_date || !start_date) {
        return res.status(400).json(rest_response(400,"Date cannot be empty"))
    }

    let type_query = "",
        branch_query = "";
    if (type_id && isNumeric(type_id)) {
      type_query = ` AND payment.[nov] = ${type_id} `;
    }

    if (branch_id && isNumeric(branch_id)) {
      branch_query = ` AND payment.[sobe] = ${branch_id} `;
    }
    end_date = new Date(end_date);
    start_date = new Date(start_date);

    end_date.setDate(end_date.getDate() + 1);


    sql_connect.then(pool => {
        return pool.request()
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .input('cashbox_id', sql.Int, cashbox_id)
            .query(`SELECT
                       CONVERT(date, payment.[tarix]) AS day_date,
                       SUM(CASE WHEN [type] = 'exit' THEN payment.[yekun] ELSE 0 END) as exit_amount,
                       SUM(CASE WHEN [type] = 'entry' THEN payment.[yekun] ELSE 0 END) as entry_amount
                    FROM ((SELECT
                              [yekun],
                              [tarix],
                              [kassa],
                              [sobe],
                              [nov],
                              'exit' as type
                          FROM ${table_name("exit_payments")})
                          UNION ALL
                          (SELECT
                            [yekun],
                            [tarix],
                            [kassa],
                            [sobe],
                            [nov],
                            'entry' as type
                        FROM ${table_name("entry_payments")})
                        ) payment
                    LEFT JOIN ${table_name("cashbox")} cashbox ON cashbox.[idn] = payment.[kassa]
                    LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = payment.[sobe]
                    LEFT JOIN ${table_name("payment_types")} type ON type.[idn] = payment.[nov]
                    WHERE payment.[tarix] >= @start_date
                    AND payment.[tarix] < @end_date
                    AND payment.[kassa] = @cashbox_id
                    ${type_query}
                    ${branch_query}
                    GROUP BY CONVERT(date, payment.[tarix])
                    ORDER BY CONVERT(date, payment.[tarix]) ASC`)
    }).then(result => {
      const payments = result.recordset;
        if(!payments.length){
            return res.status(200).json(rest_response(204,"Payment not found"))
        }

        payments.map((v,index) => {
          payments[index]["left_amount"] = 0;
          payments[index]["day_date"] = (new Date(v.day_date)).toISOString().
                                                        replace(/T/, ' ').
                                                        replace(/\..+/, '');
          payments[index]["daily_balans"] = +v.entry_amount - +v.exit_amount;
        });

        let details_list = {
            count: payments.length,
            list: payments
        };

        res.status(200).json(rest_response(200,"Success",details_list))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });
}

module.exports = {
  payment_history,
  paymentsDaily
}
