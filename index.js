const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.SERVER_PORT;

app.use(express.json());

const products = require('./src/routes/products_route');
const sales = require('./src/routes/sales_route');
const purchases = require('./src/routes/purchase_route');
const customers = require('./src/routes/customers_route');
const cashbox = require('./src/routes/cashbox_route');
const general = require('./src/routes/general_route');
const caching = require('./src/routes/caching_route');
const reports = require('./src/routes/reports_route');


const secrets = require('./src/configs/secrets.json');

const bodyParser = require('body-parser');
const path = require('path');

require('./src/helpers/customer_helper');
require('./src/helpers/db_connect');


app.use('*', (req,res,next) => {
  if(typeof secrets.usecrets === "undefined") {
    return res.status(401).json(rest_response(401,"Unauthorized"));
  }
  if(typeof secrets.usecrets[req.get('Usecret')] === "undefined" || secrets.usecrets[req.get('Usecret')] !== req.get('Ukey')) {
    return res.status(401).json(rest_response(401,"Unauthorized"))
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use('/v1/products', products);

app.use('/v1/sales', sales);

app.use('/v1/purchases', purchases);

app.use('/v1/reports', reports);

app.use('/v1/cashbox', cashbox);

app.use('/v1/general', general);

app.use('/v1/caching', caching);

app.use('/v1/customers', customers);

app.use('*', (req,res) => {
  res.status(404).json(rest_response(404,"Page not found"))
});


app.listen(port, () => {
  console.log(`Project running on port ${port}`)
});
