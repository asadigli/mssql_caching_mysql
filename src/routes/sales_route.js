const express = require('express');
const router = express.Router();

const {
  list
} = require("../controllers/sales/All");

router.get('/', list);

// router.get('/', invoices);

// router.get('/in-details', in_details);

// router.get('/in-details/:id', in_details_by_invoice);


// router.get('/returns/in-details/:id', return_in_details_by_invoice);



module.exports = router