const checkAccess = (req, res) => {
  sql_connect.then(pool => {

    return pool.request()
        .query(`SELECT COUNT(1) FROM ${table_name("branches")}`)
    }).then(result => {
        res.status(200).json(rest_response(200,"Success"))
    }).catch(err => {
      res.status(200).json(rest_response(500,"1C DB is not accessible"))
    });

}

const employees = (req, res) => {
  let datetime = moment().format('yyyy-MM-DD hh:mm:ss');

  sql_connect.then(pool => {
      return pool.request()
      .query(`SELECT
                  CONVERT(VARCHAR(1000), [_IDRRef], 1) as ID,
                  LTRIM(RTRIM([_Description])) as name
              FROM ${remote_table_name("employees")}
              WHERE [_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Employee not found"))
        }

        let employee_list = [];
        result.recordset.forEach(item => {

          employee_list.push({
            cid: item.ID,
            name: addSlashes(item.name),
            type: '0x01',
            deleted_at: null,
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_employees"), employee_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_employees")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
                              AND type = '0x01'
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`) VALUES
                                      ('employees', ${employee_list.length}, '${datetime}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": employee_list.length
        }));
      }).catch(err => {
        res.send(err);
      });
}

const currencies = (req, res) => {
  let datetime = moment().format('yyyy-MM-DD hh:mm:ss');
  sql_connect.then(pool => {
      return pool.request()
      .query(`SELECT
                  CONVERT(VARCHAR(1000), [_IDRRef], 1) as ID,
                  LTRIM(RTRIM([_Description])) as name
              FROM ${remote_table_name("currencies")}
              WHERE [_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"currency not found"))
        }

        let currency_list = [];
        result.recordset.forEach(item => {

          currency_list.push({
            cid: item.ID,
            name: addSlashes(item.name),
            deleted_at: null,
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_currencies"), currency_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_currencies")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`) VALUES
                                      ('currencies', ${currency_list.length}, '${datetime}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": currency_list.length
        }));
      }).catch(err => {
        res.send(err);
      });
}

module.exports = {
    employees,
    currencies,
}
