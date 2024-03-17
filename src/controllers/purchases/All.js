const invoices = (req,res) => {

    let {end_date, start_date, warehouse_id, customer_id, branch_id, operator_name} = req.query;
    end_date = end_date ? new Date(end_date) : null;
    start_date = start_date ? new Date(start_date) : null;

    if(!end_date || !start_date) {
        return res.status(400).json(rest_response(400,"Date cannot be empty"))
    }

    if(!isValidDate(end_date) || !isValidDate(start_date)) {
        return res.status(400).json(rest_response(409,"Date is not valid"))
    }
    let warehouse_query = "",
        customer_query = "",
        branch_query = "",
        operator_query = "";
    if(isNumeric(warehouse_id)) {
        warehouse_query = ` AND purchase.[anbar] = ${warehouse_id} `;
    }

    if(isNumeric(customer_id)) {
        customer_query = ` AND purchase.[kontra] = ${customer_id} `;
    }

    if(isNumeric(branch_id)) {
        branch_query = ` AND warehouse.[branch] = ${branch_id} `;
    }

    operator_name = operator_name ? operator_name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : null;

    if(operator_name){
        operator_query = ` AND LTRIM(RTRIM(purchase.[ins_user])) = N'${operator_name}' `;
    }

    end_date.setDate(end_date.getDate() + 1);


    sql_connect.then(pool => {

        return pool.request()
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .query(`SELECT
                        purchase.[idn] as id,
                        purchase.[sen_no] as code,
                        purchase.[ins_date] as operation_date,
                        purchase.[kontra] as customer_id,
                        purchase.[kon_name] as customer_name,
                        purchase.[mebleg] as total_price,
                        purchase.[mv_meb] as total_price_local_currency,
                        purchase.[al_xerc] as extra_cost,
                        purchase.[valyuta] as currency,
                        purchase.[serh] as comment,
                        purchase.[ins_user] as operator,
                        warehouse.[name] as warehouse,
                        purchase.[anbar] as warehouse_id,
                        branch.[name] as branch,
                        branch.[idn] as branch_id
                    FROM ${table_name("purchases")} purchase
                    LEFT JOIN ${table_name("warehouses")} warehouse ON warehouse.[idn] = purchase.[anbar]
                    LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = warehouse.[branch]
                    WHERE purchase.[ins_date] >= @start_date
                    AND purchase.[ins_date] < @end_date
                    ${warehouse_query}
                    ${customer_query}
                    ${branch_query}
                    ${operator_query}
                    ORDER BY purchase.[ins_date], purchase.[idn] ASC`)
    }).then(result => {
        if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Purchase not found"))
        }

        const list = result.recordset;
        let total_purchase_amount = 0;
        list.map((v,index) => {
            let operation_date = new Date(v.operation_date);
            total_purchase_amount += +v.total_price_local_currency;
            list[index]['operation_date'] = (operation_date).toISOString().
            replace(/T/, ' ').
            replace(/\..+/, '');
            list[index]["warehouse"] = {
                id: v.warehouse_id,
                name: v.warehouse
            };

            list[index]["customer"] = {
                id: v.customer_id,
                name: v.customer_name
            };

            list[index]["branch"] = {
                id: v.branch_id,
                name: v.branch
            };


            delete list[index]["branch_id"];
            delete list[index]["warehouse_id"];
            delete list[index]["customer_id"];
            delete list[index]["customer_name"];

        });

        let invoice_list = {
            count: list.length,
            total_purchase_amount: total_purchase_amount,
            list: list
        };
        res.status(200).json(rest_response(200,"Success",invoice_list))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });

}

const in_details = (req,res) => {

    let {
        end_date,
        start_date,
        warehouse_id,
        customer_id,
        branch_id,
        operator_name,
        product_type_id,
        product_group_id,
        product_code,
        product_id,
        exclude_suppliers
    } = req.query;

    end_date = end_date ? new Date(end_date) : null;
    start_date = start_date ? new Date(start_date) : null;

    if(!end_date || !start_date) {
        return res.status(400).json(rest_response(400,"Date cannot be empty"))
    }

    if(!isValidDate(end_date) || !isValidDate(start_date)) {
        return res.status(400).json(rest_response(409,"Date is not valid"))
    }


    let warehouse_query = "",
        customer_query = "",
        branch_query = "",
        operator_query = "",
        product_type_query = "",
        product_group_query = "",
        product_query = "",
        date_query = "",
        exclude_suppliers_query = "";

    if((product_id && isNumeric(product_id)) || (product_code && isNumeric(product_code))) {
        const param_year = start_date.getFullYear();
        date_query = ` WHERE YEAR(purchase.[ins_date]) = '${param_year}' `;
        product_query = product_id ? ` AND purchase_detail.[mal] = ${product_id} ` : ` AND product.[serial] = '${product_code}' `;
    } else {
        date_query = ` WHERE purchase.[ins_date] >= @start_date AND purchase.[ins_date] < @end_date `;
        if(isNumeric(warehouse_id)) {
            warehouse_query = ` AND purchase.[anbar] = ${warehouse_id} `;
        }

        if(isNumeric(product_type_id)) {
            product_type_query = ` AND product.[class] = ${product_type_id} `;
        }

        if(isNumeric(product_group_id)) {
            product_group_query = ` AND product.[qrup] = ${product_group_id} `;
        }

        if(isNumeric(customer_id)) {
            customer_query = ` AND purchase.[kontra] = ${customer_id} `;
        }

        if(isNumeric(branch_id)) {
            branch_query = ` AND warehouse.[branch] = ${branch_id} `;
        }

        if(exclude_suppliers && parseInt(exclude_suppliers) === 1) {
            exclude_suppliers_query = ` AND customer.[nov] IN (0,3) `;
        }

        operator_name = operator_name ? operator_name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') : null;

        if(operator_name){
            operator_query = ` AND LTRIM(RTRIM(purchase.[ins_user])) = N'${operator_name}' `;
        }
    }

    const now = new Date();
    const current_year = now.getFullYear();
    const previous_year = current_year - 1;
    const today = now.getFullYear() + '-' + (((now.getMonth() + 1) + "").padStart(2, "0")) + '-' + now.getDate();

    end_date.setDate(end_date.getDate() + 1);

    sql_connect.then(pool => {

        return pool.request()
            .input('start_date', sql.Date, start_date)
            .input('end_date', sql.Date, end_date)
            .query(`SELECT
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


                        ISNULL(exits.previous_year_exit,0) as previous_year_exit,
                        ISNULL(exits.current_year_exit,0) as current_year_exit,
                        ISNULL(entries.previous_year_entry,0) as previous_year_entry,
                        ISNULL(entries.current_year_entry,0) as current_year_entry,
                        last_purchase.code as last_purchase_code,
                        ISNULL(last_purchase.amount,0) as real_first_price,

                        product.[serial] as product_code,
                        quantities.amount as product_quantity,

                        warehouse.[name] as warehouse,
                        purchase.[anbar] as warehouse_id,
                        branch.[name] as branch,
                        branch.[idn] as branch_id,
                        CASE WHEN purchase_detail.[org_kod] IS NOT NULL AND LTRIM(RTRIM(purchase_detail.[org_kod])) != ''
                                THEN LTRIM(RTRIM(purchase_detail.[org_kod])) ELSE NULL END as OEM,
                        ISNULL((SELECT SUM(sale_detail.[miqdar])
                                FROM ${table_name("sale_details")} sale_detail
                                LEFT JOIN ${table_name("sales")} sale ON sale.[idn] = sale_detail.[es_no]
                                WHERE sale_detail.[mal] = purchase_detail.[mal]
                                AND CONVERT(DATE, sale.[ins_date]) = '${today}'),0) as today_sold_count

                    FROM ${table_name("purchase_details")} purchase_detail
                    OUTER APPLY (SELECT TOP 1 sub_purchase.[sen_no] as code,sub_purchase_detail.[son_qiy] as amount
                                FROM ${table_name("purchase_details")} sub_purchase_detail
                                LEFT JOIN ${table_name("purchases")} sub_purchase ON sub_purchase.[idn] = sub_purchase_detail.[es_no]
                                LEFT JOIN ${table_name("customers")} sub_customer ON sub_customer.[idn] = sub_purchase.[kontra]
                                WHERE sub_customer.[nov] IN (1)
                                AND sub_purchase_detail.[mal] = purchase_detail.[mal]
                                ORDER BY sub_purchase.[tarix] DESC) last_purchase
                    OUTER APPLY (SELECT
                                    SUM(CASE WHEN YEAR(sale.[ins_date]) = '${current_year}' THEN sale_detail.[miqdar] ELSE 0 END) as current_year_exit,
                                    SUM(CASE WHEN YEAR(sale.[ins_date]) = '${previous_year}' THEN sale_detail.[miqdar] ELSE 0 END) as previous_year_exit
                                FROM ${table_name("sale_details")} as sale_detail
                                LEFT JOIN ${table_name("sales")} sale ON sale.[idn] = sale_detail.[es_no]
                                WHERE sale_detail.[mal] = purchase_detail.[mal]
                                AND YEAR(sale.[ins_date]) >= ${previous_year}) exits
                    OUTER APPLY (SELECT
                                    SUM(CASE WHEN YEAR(purchases.[ins_date]) = '${current_year}' THEN sub_purchase_detail.[miqdar] ELSE 0 END) as current_year_entry,
                                    SUM(CASE WHEN YEAR(purchases.[ins_date]) = '${previous_year}' THEN sub_purchase_detail.[miqdar] ELSE 0 END) as previous_year_entry
                                FROM ${table_name("purchase_details")} as sub_purchase_detail
                                LEFT JOIN ${table_name("purchases")} purchases ON purchases.[idn] = sub_purchase_detail.[es_no]
                                WHERE sub_purchase_detail.[mal] = purchase_detail.[mal]
                                AND YEAR(purchases.[ins_date]) >= ${previous_year}) entries
                    LEFT JOIN ${table_name("purchases")} purchase ON purchase.[idn] = purchase_detail.[es_no]
                    LEFT JOIN ${table_name("products")} product ON product.[idn] = purchase_detail.[mal]
                    OUTER APPLY (SELECT SUM(miqdar - say_sil) as amount
                                FROM ${table_name("product_quantities")}
                                WHERE mal = purchase_detail.[mal]) quantities
                    LEFT JOIN ${table_name("product_groups")} product_group ON product_group.[idn] = product.[qrup]
                    LEFT JOIN ${table_name("product_types")} product_type ON product_type.[idn] = product.[class]
                    LEFT JOIN ${table_name("warehouses")} warehouse ON warehouse.[idn] = purchase.[anbar]
                    LEFT JOIN ${table_name("customers")} customer ON customer.[idn] = purchase.[kontra]
                    LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = warehouse.[branch]
                    ${date_query}
                    ${operator_query}
                    ${branch_query}
                    ${customer_query}
                    ${warehouse_query}
                    ${product_type_query}
                    ${product_group_query}
                    ${product_query}
                    ${exclude_suppliers_query}
                    ORDER BY purchase.[ins_date],
                            purchase.[idn] ASC`)
    }).then(result => {
        if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Purchase not found"))
        }
        let details_list = {
            count: result.recordset.length,
            list: result.recordset
        };
        let total_purchase_amount = 0;

        details_list.list.map((v,key) => {
            details_list.list[key]["product"] = {
                id: v.product_id,
                code: v.product_code,
                name: v.product_name,
                OEM: v.OEM,
                group: {
                    id: v.product_group_id,
                    name: v.product_group_name
                },
                type: {
                    id: v.product_type_id,
                    name: v.product_type_name
                },
                quantity: v.product_quantity,
                previous_year_exit_count: v.previous_year_exit,
                current_year_exit_count: v.current_year_exit,
                previous_year_entry_count: v.previous_year_entry,
                current_year_entry_count: v.current_year_entry,
                real_first_price: v.real_first_price,
                last_purchase_code: v.last_purchase_code

           };

           details_list.list[key]['operation_date'] = (new Date(v.operation_date)).toISOString().
            replace(/T/, ' ').
            replace(/\..+/, '');
           total_purchase_amount += +v.total_price_with_tax;

           details_list.list[key]["warehouse"] = {
                id: v.warehouse_id,
                name: v.warehouse
            };

            details_list.list[key]["customer"] = {
                id: v.customer_id,
                name: v.customer_name
            };

            details_list.list[key]["branch"] = {
                id: v.branch_id,
                name: v.branch
            };


            delete details_list.list[key]["branch_id"];
            delete details_list.list[key]["warehouse_id"];
            delete details_list.list[key]["customer_id"];
            delete details_list.list[key]["customer_name"];

            delete details_list.list[key]["product_id"];
            delete details_list.list[key]["product_name"];
            delete details_list.list[key]["OEM"];

            delete details_list.list[key]["product_group_id"];
            delete details_list.list[key]["product_group_name"];
            delete details_list.list[key]["product_type_id"];
            delete details_list.list[key]["product_type_name"];
            delete details_list.list[key]["product_code"];
            delete details_list.list[key]["product_quantity"];


            delete details_list.list[key]["previous_year_exit"];
            delete details_list.list[key]["current_year_exit"];
            delete details_list.list[key]["previous_year_entry"];
            delete details_list.list[key]["current_year_entry"];

            delete details_list.list[key]["real_first_price"];
            delete details_list.list[key]["last_purchase_code"];


        });
        details_list["total_purchase_amount"] = total_purchase_amount;
        res.status(200).json(rest_response(200,"Success",details_list))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });
}


const in_details_by_invoice = (req,res) => {
    let invoice_id = req.params.id;
    if(!invoice_id || !isNumeric(invoice_id)) {
        return res.status(400).json(rest_response(400,"Invoice ID cannot be empty"))
    }

    const current_year = (new Date()).getFullYear();
    const previous_year = current_year - 1;


    sql_connect.then(pool => {

        return pool.request()
            .input('invoice_id', sql.Int, invoice_id)
            .query(`SELECT
                        purchase.[idn] as id,
                        purchase.[sen_no] as code,
                        purchase.[ins_date] as operation_date,
                        purchase.[kon_name] as customer_name,
                        purchase.[valyuta] as currency,
                        purchase.[ins_user] as operator,

                        purchase_detail.[miqdar] as count,
                        purchase_detail.[qiymet] as per_price,
                        purchase_detail.[mebleg] as total_price,
                        purchase_detail.[yekun] as total_price_with_tax,


                        purchase_detail.[son_qiy] as per_price_in_local_currency,
                        purchase_detail.[son_meb] as total_price_in_local_currency,
                        purchase_detail.[xerc_meb] as extra_cost,

                        purchase.[mebleg] as total_invoice_price,
                        purchase.[mv_meb] as total_invoice_price_in_local_currency,
                        purchase.[al_xerc] as invoice_extra_cost,


                        purchase_detail.[qeyd] as comment,
                        purchase_detail.[mal] as product_id,
                        purchase_detail.[el_name] as product_name,
                        CASE WHEN purchase_detail.[org_kod] IS NOT NULL AND LTRIM(RTRIM(purchase_detail.[org_kod])) != ''
                                THEN LTRIM(RTRIM(purchase_detail.[org_kod])) ELSE NULL END as OEM,
                        warehouse.[name] as warehouse,
                        purchase.[anbar] as warehouse_id,
                        branch.[name] as branch,
                        branch.[idn] as branch_id,
                        purchase.[serh] as invoice_comment,
                        ISNULL(exits.previous_year_exit,0) as previous_year_exit,
                        ISNULL(exits.current_year_exit,0) as current_year_exit,
                        ISNULL(entries.previous_year_entry,0) as previous_year_entry,
                        ISNULL(entries.current_year_entry,0) as current_year_entry,

                        product_group.[idn] as product_group_id,
                        product_group.[name] as product_group_name,

                        product_type.[idn] as product_type_id,
                        product_type.[name] as product_type_name,

                        product.[serial] as product_code

                    FROM ${table_name("purchase_details")} purchase_detail
                    OUTER APPLY (SELECT
                                    SUM(CASE WHEN YEAR(sale.[ins_date]) = '${current_year}' THEN sub_sale_detail.[miqdar] ELSE 0 END) as current_year_exit,
                                    SUM(CASE WHEN YEAR(sale.[ins_date]) = '${previous_year}' THEN sub_sale_detail.[miqdar] ELSE 0 END) as previous_year_exit
                                FROM ${table_name("sale_details")} as sub_sale_detail
                                LEFT JOIN ${table_name("sales")} sale ON sale.[idn] = sub_sale_detail.[es_no]
                                WHERE sub_sale_detail.[mal] = purchase_detail.[mal]
                                AND YEAR(sale.[ins_date]) >= ${previous_year}) exits
                    OUTER APPLY (SELECT
                                    SUM(CASE WHEN YEAR(purchases.[ins_date]) = '${current_year}' THEN sub_purchase_detail.[miqdar] ELSE 0 END) as current_year_entry,
                                    SUM(CASE WHEN YEAR(purchases.[ins_date]) = '${previous_year}' THEN sub_purchase_detail.[miqdar] ELSE 0 END) as previous_year_entry
                                FROM ${table_name("purchase_details")} as sub_purchase_detail
                                LEFT JOIN ${table_name("purchases")} purchases ON purchases.[idn] = sub_purchase_detail.[es_no]
                                WHERE sub_purchase_detail.[mal] = purchase_detail.[mal]
                                AND YEAR(purchases.[ins_date]) >= ${previous_year}) entries

                    LEFT JOIN ${table_name("purchases")} purchase ON purchase.[idn] = purchase_detail.[es_no]

                    LEFT JOIN ${table_name("products")} product ON product.[idn] = purchase_detail.[mal]

                    LEFT JOIN ${table_name("product_groups")} product_group ON product_group.[idn] = product.[qrup]
                    LEFT JOIN ${table_name("product_types")} product_type ON product_type.[idn] = product.[class]

                    LEFT JOIN ${table_name("warehouses")} warehouse ON warehouse.[idn] = purchase.[anbar]
                    LEFT JOIN ${table_name("branches")} branch ON branch.[idn] = warehouse.[branch]

                    WHERE purchase.[idn] = @invoice_id
                    ORDER BY purchase.[ins_date], purchase.[idn] ASC`)
    }).then(result => {
        if(!result.recordset.length){
            return res.status(200).json(rest_response(204,"Purchase not found"))
        }

        let purchase_details_list = [],invoice = [];
        result.recordset.map((v,index) => {
            invoice = {
                id: v.id,
                code: v.code,
                operation_date: (new Date(v.operation_date)).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                customer_name: v.customer_name,
                currency: v.currency,
                operator: v.operator,
                total_amount_in_local_currency: v.total_invoice_price_in_local_currency,
                extra_cost: v.invoice_extra_cost,
                total_amount: v.total_invoice_price,
                warehouse: {
                    id: v.warehouse_id,
                    name: v.warehouse
                },
                branch: {
                    id: v.branch_id,
                    name: v.branch
                },
                comment: v.invoice_comment ? v.invoice_comment : null
            };


            purchase_details_list.push({
                count: v.count,
                per_price: v.per_price,
                per_price_in_local_currency: v.per_price_in_local_currency,
                total_price: v.total_price,
                total_price_with_tax: v.total_price_with_tax,
                total_price_in_local_currency: v.total_price_in_local_currency,
                comment: v.comment,
                product: {
                    id: v.product_id,
                    name: v.product_name,
                    OEM: v.OEM,
                    code: v.product_code,
                    group: {
                        id: v.product_group_id,
                        name: v.product_group_name
                    },
                    type: {
                        id: v.product_type_id,
                        name: v.product_type_name
                    },
                    previous_year_exit_count: v.previous_year_exit,
                    current_year_exit_count: v.current_year_exit,
                    previous_year_entry_count: v.previous_year_entry,
                    current_year_entry_count: v.current_year_entry
                }
            });
        });

        res.status(200).json(rest_response(200,"Success",{invoice,list: purchase_details_list}))
    }).catch(err => {
      logger.add(JSON.parse(err))
    });
}

module.exports = {
    invoices,
    in_details,
    in_details_by_invoice
}
