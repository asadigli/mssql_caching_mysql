const express = require('express')
const router = express.Router()
const {
  invoices,
  in_details,
  in_details_by_invoice
} = require("../controllers/purchases/All")


router.get('/', invoices);

router.get('/in-details', in_details);

router.get('/in-details/:id', in_details_by_invoice);


module.exports = router