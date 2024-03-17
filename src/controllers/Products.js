const { log } = require("winston");

const parents = (req, res) => {
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
                  CONVERT(VARCHAR(1000), pp.[_IDRRef], 1) AS ID,
                  LTRIM(RTRIM(pp.[_Description])) AS name,
                  LTRIM(RTRIM(pp_sub.[_Description])) AS parent_name,
                  CONVERT(VARCHAR(1000), pp.[_Folder], 1) as is_folder
              FROM ${remote_table_name("product_parents")} pp
              LEFT JOIN ${remote_table_name("product_parents")} pp_sub ON pp_sub.[_IDRRef] = pp.[_ParentIDRRef]
              WHERE pp.[_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product parent not found"))
        }

        let product_parent_list = [];

        result.recordset.forEach(item => {

          product_parent_list.push({
            cid: item.ID,
            name: addSlashes(item.name),
            parent_name: addSlashes(item.parent_name),
            is_folder: item.is_folder === '0x00' ? '1' : '0',
            deleted_at: null,
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_product_parents"), product_parent_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_product_parents")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          // logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('product-parents', ${product_parent_list.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          // logger.info(err);
          // console.log(err);
        });

        // mysql_connect.end();
        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_parent_list.length
        }));
      }).catch(err => {
        // res.send(err);
        // logger.info(err);
      });
}

const brands = (req, res) => {
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
               CONVERT(VARCHAR(1000), [_IDRRef], 1) as ID,
               [_Description] as [name]
              FROM ${remote_table_name("product_brands")}
              WHERE [_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product brand not found"))
        }

        let product_brand_list = [];
        result.recordset.forEach(item => {

          product_brand_list.push({
            cid: item.ID,
            name: addSlashes(item.name),
            deleted_at: null,
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_product_brands"), product_brand_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_product_brands")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          // logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('product-brands', ${product_brand_list.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
         console.log(err);
        });

        // mysql_connect.end();
        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_brand_list.length
        }));
      }).catch(err => {
        // res.send(err);
        // logger.info(err);
      });
}

const priceTypes = (req, res) => {
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
               CONVERT(VARCHAR(1000), [_IDRRef], 1) as ID,
               [_Description] as [name]
              FROM ${remote_table_name("product_price_types")}
              WHERE [_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product price type not found"))
        }

        let product_price_type_list = [];
        result.recordset.forEach(item => {

          product_price_type_list.push({
            cid: item.ID,
            name: addSlashes(item.name),
            deleted_at: null,
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_product_price_types"), product_price_type_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_product_price_types")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          // logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('product-price-types', ${product_price_type_list.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          // logger.info(err);
        });

        // mysql_connect.end();
        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_price_type_list.length
        }));
      }).catch(err => {
        // res.send(err);
        // logger.info(err);
      });
}

const prices = (req, res) => {
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
                CONVERT(VARCHAR(1000), products.[_IDRRef], 1) as ID,
                product_prices.[type_id],
                product_prices.[amount]
            FROM ${remote_table_name("products")} products
            LEFT JOIN (SELECT
                        price_row.[_Fld64359RRef] as product_ID,
                        CONVERT(VARCHAR(1000), price_row.[_Fld64361RRef], 1) as type_id,
                        (SELECT TOP 1 sub_price.[_Fld64362]
                        FROM ${remote_table_name("product_prices")} sub_price
                        WHERE sub_price.[_Fld64361RRef] = price_row.[_Fld64361RRef]
                        AND sub_price.[_Fld64359RRef] = price_row.[_Fld64359RRef]
                        AND sub_price.[_Active] = 0x01
                        ORDER BY _Period DESC) as amount
                    FROM ${remote_table_name("product_prices")} price_row
                LEFT JOIN ${remote_table_name("product_price_types")} price_type ON price_type.[_IDRRef] = price_row.[_Fld64361RRef]
                AND price_row.[_Active] = 0x01
                GROUP BY price_row.[_Fld64359RRef],price_row.[_Fld64361RRef]) product_prices ON product_prices.[product_ID] = products.[_IDRRef]
            WHERE products.[_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product price type not found"))
        }

        let product_prices = [];
        result.recordset.forEach(item => {

          product_prices.push({
            cid: md5(item.ID + '-|SPRT|-' + item.type_id),
            product_cid: item.ID,
            product_price_type_cid: item.type_id,
            price: stringify(item.amount),
            deleted_at: null,
          });
        });
        const query = insert_dublicate_key(local_table_name("cached_product_prices"), product_prices);

        mysql_connect.query(`UPDATE ${local_table_name("cached_product_prices")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('product-prices', ${product_prices.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_prices.length
        }));
      }).catch(err => {
        logger.info(err);
      });
}

const quantities = (req, res) => {
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
                  CONVERT(VARCHAR(1000), products.[_IDRRef], 1) as ID,
                  quantity_data.[numb] as quantity
              FROM ${remote_table_name("products")} products
              OUTER APPLY (SELECT SUM(pq.[_Fld68349] - pq.[_Fld68350]) as numb
                                          FROM ${remote_table_name("product_quantites")} pq
                                          WHERE pq.[_Fld68346RRef] = products.[_IDRRef]
                                          AND YEAR(pq.[_Period]) = '5999') as quantity_data
              WHERE products.[_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product price type not found"))
        }

        let product_quantities = [];
        result.recordset.forEach(item => {

          product_quantities.push({
            cid: item.ID,
            product_cid: item.ID,
            quantity: stringify(item.quantity),
            deleted_at: null,
          });
        });
        const query = insert_dublicate_key(local_table_name("cached_product_quantities"), product_quantities);

        mysql_connect.query(`UPDATE ${local_table_name("cached_product_quantities")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('product-quantities', ${product_quantities.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_quantities.length
        }));
      }).catch(err => {
        res.send(err);
      });
}

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
                  CONVERT(VARCHAR(1000), products.[_IDRRef], 1) as ID,
                  CONVERT(VARCHAR(1000), products.[_Fld41034RRef], 1) as brand_ID,
                  CONVERT(VARCHAR(1000), products.[_Fld41008RRef], 1) as parent_ID,
                  products.[_Code] as code,
                  LTRIM(RTRIM(products.[_Description])) as name,
                  products.[_Fld40998] as brand_code

            FROM ${remote_table_name("products")} products
            WHERE products.[_Marked] = 0x00
      `)
      }).then(result => {
        if(!result.recordset.length){
          return res.status(200).json(rest_response(204,"Product price type not found"))
        }

        let product_list = [];
        result.recordset.forEach(item => {

          let brand_code = item.brand_code;
          brand_code = addSlashes(brand_code) || null;
          let cleaned_brand_code = brand_code ? addSlashes(cleaned(brand_code)) : null;

          product_list.push({
            cid: item.ID,
            remote_id: item.ID,
            brand_cid: item.brand_ID === BLOB_ZERO ? null : item.brand_ID,
            parent_cid: item.parent_ID === BLOB_ZERO ? null : item.parent_ID,
            code: item.code,
            name: addSlashes(item.name),
            brand_code,
            cleaned_brand_code,
            deleted_at: null
          });
        });

        const query = insert_dublicate_key(local_table_name("cached_products"), product_list);

        mysql_connect.query(`UPDATE ${local_table_name("cached_products")}
                              SET deleted_at = '${datetime}'
                              WHERE deleted_at IS NULL
        `);
        mysql_connect.query(query, function(err) {
          logger.info(err);
        });

        const history_data_query = `INSERT INTO ${local_table_name("cached_history")}
                                      (\`type\`, \`result_count\`, \`operation_date\`, \`request_type\`) VALUES
                                      ('products', ${product_list.length}, '${datetime}', '${request_type}')`;
        mysql_connect.query(history_data_query, function(err) {
          logger.info(err);
        });

        res.status(200).json(rest_response(200,"Success",{
          "result_count": product_list.length
        }));
      }).catch(err => {
        res.send(err);
      });
}

module.exports = {
    parents,
    brands,
    priceTypes,
    prices,
    quantities,
    list
}
