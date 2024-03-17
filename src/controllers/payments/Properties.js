const payment_types = (req, res) => {
    sql_connect.then(pool => {

      return pool.request()
          .query(`SELECT
                        [idn] as id,
                        [kod] as code,
                        [name],
                        [qrup] as group_id,
                        CASE WHEN [gelir] = 1 THEN '1' ELSE '0' END as is_income,
                        CASE WHEN [xerc] = 1 THEN '1' ELSE '0' END as is_expense
                  FROM ${table_name("payment_types")}
                  ORDER BY [name] ASC`)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Payment type not found"))
        }
        let type_list = result.recordset;
        type_list.map((v,key) => {
          type_list[key]["is_income"] = v.is_income === "1";
          type_list[key]["is_expense"] = v.is_expense === "1";
        });
        res.status(200).json(rest_response(200,"Success",type_list))
      }).catch(err => {
        logger.add(err)
      });

}


const payment_groups = (req, res) => {
  sql_connect.then(pool => {

    return pool.request()
        .query(`SELECT
                      [idn] as id,
                      [name]
                FROM ${table_name("payment_groups")}
                ORDER BY [name] ASC`)
    }).then(result => {
      if(!result.recordset.length){
        return res.status(200).json(rest_response(204,"Payment group not found"))
      }
        res.status(200).json(rest_response(200,"Success",result.recordset))
    }).catch(err => {
      logger.add(err)
    });

}

module.exports = {
    payment_types,
    payment_groups
}
