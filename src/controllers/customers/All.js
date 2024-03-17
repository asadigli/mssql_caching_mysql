
const list = (req, res) => {
  let datetime = moment().format('yyyy-MM-DD hh:mm:ss');
  let {
      start_date,
      end_date,
      limit_hour,
      request_type
  } = req.query;

  sql_connect.then(pool => {
      return pool.request()
      .query(`SELECT
                CONVERT(VARCHAR(1000), customers.[_IDRRef], 1) as ID,
                customers.[_Code] as code,
                LTRIM(RTRIM(customers.[_Description])) as name,
                cust_address.[_Fld39826] as address,
                cust_phone.[_Fld39826] as phone,
                cust_email.[_Fld39826] as email
            FROM ${remote_table_name("customers")} customers
            LEFT JOIN ${remote_table_name("customers_secondary")} cust_secondary ON cust_secondary._Fld39812RRef = customers._IDRRef
            LEFT JOIN ${remote_table_name("customer_details")} cust_address ON cust_address._Reference304_IDRRef = cust_secondary._IDRRef AND cust_address._KeyField = 0x00000001
            LEFT JOIN ${remote_table_name("customer_details")} cust_phone ON cust_phone._Reference304_IDRRef = cust_secondary._IDRRef AND cust_phone._KeyField = 0x00000002
            LEFT JOIN ${remote_table_name("customer_details")} cust_email ON cust_email._Reference304_IDRRef = cust_secondary._IDRRef AND cust_email._KeyField = 0x00000003
            WHERE customers._Folder = 0x01
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product price type not found"))
        }

        let customer_list = [];
        result.recordset.forEach(item => {

          let brand_code = item.brand_code;
          brand_code = addSlashes(brand_code) || null;
          let cleaned_brand_code = brand_code ? addSlashes(cleaned(brand_code)) : null;

          customer_list.push({
            cid: item.ID,
            code: item.code,
            name: addSlashes(item.name),
            address: addSlashes(item.address),
            phone: addSlashes(item.phone),
            email: addSlashes(item.email),
            deleted_at: null
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_customers"), customer_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_customers")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('customers', ${customer_list.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": customer_list.length
        }));
      }).catch(err => {
        res.send(err);
      });
}

module.exports = {
    list
}
