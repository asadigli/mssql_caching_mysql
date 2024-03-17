const salesReports = (req,res) => {
    const now = new Date();
    const current_year = now.getFullYear();
    const current_month = now.getMonth() + 1;
    const current_day = now.getDate();


    sql_connect.then(pool => {

        return pool.request()
            .query(`SELECT
                        SUM(sale.[mebleg]) as annual_sales,
                        SUM(CASE WHEN MONTH(sale.[tarix]) = '${current_month}'
                            THEN sale.[mebleg] ELSE 0 END) AS monthly_sales,
                        SUM(CASE WHEN MONTH(sale.[tarix]) = '${current_month}' AND DAY(sale.[tarix]) = '${current_day}'
                            THEN sale.[mebleg] ELSE 0 END) AS daily_sales

                    FROM ${table_name("sales")} sale
                    WHERE YEAR(sale.[tarix]) = '${current_year}'`)
    }).then(result => {
        if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Sale not found"))
        }

        const list = result.recordset[0];

        res.status(200).json(rest_response(200,"Success",list))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });

}




const monthlySales = (req,res) => {
    const now = new Date();
    const current_year = now.getFullYear(),
          current_month = now.getMonth() + 1,
          current_day = now.getDate();
    const prev_month = current_month - 1;
    const prev_year = prev_month === 1 ? (current_year - 1) : current_year;

    sql_connect.then(pool => {

        return pool.request()
            .query(`SELECT * FROM (
                        (SELECT
                            CAST(sale.[tarix] AS DATE) as day_date,
                            SUM(sale.[mebleg]) as sales
                        FROM ${table_name("sales")} sale
                        WHERE YEAR(sale.[tarix]) = '${current_year}'
                        AND MONTH(sale.[tarix]) = '${current_month}'
                        GROUP BY CAST(sale.[tarix] AS DATE))
                        UNION ALL
                        (SELECT
                            CAST(sale.[tarix] AS DATE) as day_date,
                            SUM(sale.[mebleg]) as sales
                        FROM ${table_name("sales")} sale
                        WHERE YEAR(sale.[tarix]) = '${prev_year}'
                        AND MONTH(sale.[tarix]) = '${prev_month}'
                        AND DAY(sale.[tarix]) <= '${current_day}'
                        GROUP BY CAST(sale.[tarix] AS DATE))
                        ) as local_query`)
    }).then(result => {
        if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Sale not found"))
        }

        const list = [];

        result.recordset.map((v,index) => {
            list[(new Date(v.day_date).getDate() - 1)] = list[(new Date(v.day_date).getDate() - 1)] || [];
            list[(new Date(v.day_date).getDate() - 1)].push({
                day_date: (new Date(v.day_date)).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                amount: v.sales,
            });
        })

        res.status(200).json(rest_response(200,"Success",list))
    }).catch(err => {
        res.send(err)
    });

}



module.exports = {
    salesReports,
    monthlySales
}
