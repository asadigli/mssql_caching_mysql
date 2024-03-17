const list = (req, res) => {
    let datetime = moment().format('yyyy-MM-DD hh:mm:ss');

    let {
        start_date,
        end_date,
        limit_hour,
        request_type,
    } = req.query;

    end_date = end_date ? new Date(end_date) : null;
    start_date = start_date ? new Date(start_date) : null;

    if(!limit_hour) {
        if(!end_date || !start_date) {
            return res.status(400).json(rest_response(400,"Date cannot be empty"));
        }
        if(start_date && !isValidDate(start_date)) {
            return res.status(400).json(rest_response(409,"start_date is not valid"))
        }

        if(end_date && !isValidDate(end_date)) {
            return res.status(400).json(rest_response(409,"end_date is not valid"))
        }
    }
    if(limit_hour && !isNumeric(limit_hour)) {
        return res.status(400).json(rest_response(400,"Limit hour should be numeric"));
    }
    if(isNumeric(limit_hour)) {
        end_date = datetime;
        start_date = moment(datetime, 'yyyy-MM-DD hh:mm:ss').add(-limit_hour, 'hours').format('yyyy-MM-DD hh:mm:ss');
    }

    end_date = end_date ? moment(end_date, 'yyyy-MM-DD hh:mm:ss').format('yyyy-MM-DD hh:mm:ss') : null;
    start_date = start_date ? moment(start_date, 'yyyy-MM-DD hh:mm:ss').format('yyyy-MM-DD hh:mm:ss') : null;

    let old_start_date = start_date,
    old_end_date = end_date;

    start_date = moment(start_date, 'yyyy-MM-DD hh:mm:ss').add(2000, 'years').format('yyyy-MM-DD hh:mm:ss');
    end_date = moment(end_date, 'yyyy-MM-DD hh:mm:ss').add(2000, 'years').format('yyyy-MM-DD hh:mm:ss');

    let start_date_sql = ` AND sales.[_Date_Time] >= '${start_date}' `,
        end_date_sql = `AND sales.[_Date_Time] <= '${end_date}' `;

    sql_connect.then(pool => {
        return pool.request()
        .query(`SELECT
                    sales_details.[_LineNo26048] as line_no,
                    CONVERT(VARCHAR(1000), sales.[_IDRRef], 1) as sale_ID,
                    sales.[_Number] as sale_code,
                    CONVERT(varchar, DATEADD(year, -2000, sales.[_Date_Time]), 20) as operation_date,
                    sales.[_Fld26007] as comment,
                    CONVERT(VARCHAR(1000), sales.[_Fld25973RRef], 1) as currency_ID,
                    CONVERT(VARCHAR(1000), sales.[_Fld25988RRef], 1) as customer_ID,
                    CONVERT(VARCHAR(1000), sales.[_Fld25985RRef], 1) as seller_ID,
                    CONVERT(VARCHAR(1000), sales_details.[_Fld26049RRef], 1) as product_ID,
                    sales_details.[_Fld26053] as quantity,
                    sales_details.[_Fld26056] as per_price,
                    sales_details.[_Fld26057] as total_price,
                    sales_details.[_Fld26059] as tax_amount,
                    sales_details.[_Fld26069] as total_price_with_tax,

                    sales.[_Fld25995] as sales_total_price

                FROM ${remote_table_name("sales_details")} sales_details
                LEFT JOIN ${remote_table_name("sales")} sales ON sales.[_IDRRef] = sales_details.[_Document1163_IDRRef]
                WHERE sales.[_Marked] = 0x00
                AND sales.[_Posted] = 0x01
                ${start_date_sql}
                ${end_date_sql}
        `)
        }).then(result => {
          if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Sale not found"))
          }

          let sales_details_list = [],
          sales_list = {};

          result.recordset.forEach(item => {
            sales_list[item.sale_ID] = {
                cid: item.sale_ID,
                currency_cid: item.currency_ID === BLOB_ZERO ? null : item.currency_ID,
                customer_cid: item.customer_ID === BLOB_ZERO ? null : item.customer_ID,
                seller_cid: item.seller_ID === BLOB_ZERO ? null : item.seller_ID,
                code: stringify(item.sale_code),
                operation_date: stringify(item.operation_date),
                total_price: stringify(item.sales_total_price),
                comment: addSlashes(item.comment),
                deleted_at: null,
            };

            sales_details_list.push({
                cid: md5(item.sale_ID + "|SPRTR|" + item.product_ID),
                sale_cid: item.sale_ID,
                product_cid: item.product_ID,
                line_no: stringify(item.line_no),
                quantity: stringify(item.quantity),
                per_price: stringify(item.per_price),
                total_price: stringify(item.total_price),
                vat_price: stringify(item.tax_amount),
                total_price_with_vat: stringify(item.total_price_with_tax),
                deleted_at: null,
            });
          });
          sales_list = Object.values(sales_list);

          const sale_query = insert_dublicate_key(local_table_name("cached_sales"), sales_list),
                sale_details_query = insert_dublicate_key(local_table_name("cached_sale_details"), sales_details_list);

          if(sales_list.length && sale_query.length) {
            mysql_connect.query(`UPDATE ${local_table_name("cached_sales")}
                                SET deleted_at = '${datetime}'
                                WHERE deleted_at IS NULL
                                AND operation_date > '${old_start_date}'
                                AND operation_date < '${old_end_date}'
          `);

            mysql_connect.query(sale_query, function(err) {
                logger.info(err);
            });


          const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                        (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                        ('sales', ${sales_list.length}, '${datetime}', '${request_type}')`;
            mysql_connect.query(history_data_query, function(err) {
              logger.info(err);
            });
          }

          if(sales_details_list.length && sale_details_query.length) {
            mysql_connect.query(`UPDATE ${local_table_name("cached_sale_details")} sale_details
                                LEFT JOIN ${local_table_name("cached_sales")} sales ON sales.cid = sale_details.sale_cid
                                SET sale_details.deleted_at = '${datetime}'
                                WHERE sale_details.deleted_at IS NULL
                                AND sales.operation_date > '${old_start_date}'
                                AND sales.operation_date < '${old_end_date}'`);


            mysql_connect.query(sale_details_query, function(err) {
              logger.info(err);
            });


          const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                        (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                        ('sale-details', ${sales_details_list.length}, '${datetime}', '${request_type}' )`;
            mysql_connect.query(history_data_query, function(err) {
              logger.info(err);
            });
          }


          res.status(200).json(rest_response(200,"Success",{
            "result_count": sales_list.length
          }));
        }).catch(err => {
          res.send(err);
        });
}

module.exports = {
    list
}
