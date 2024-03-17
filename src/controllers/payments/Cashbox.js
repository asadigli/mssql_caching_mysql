const allList = (req, res) => {
    sql_connect.then(pool => {
      // Query
      
      return pool.request()
          .query(`SELECT 
                        [idn] as id,
                        [kod] as code,
                        [name],
                        [valyuta] as currency
                  FROM ${table_name("cashbox")}
                  ORDER BY [name] ASC`)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Cashbox not found"))
        }
          res.status(200).json(rest_response(200,"Success",result.recordset))
      }).catch(err => {
        logger.add(err)
      });
  
}

module.exports = {
    allList
}