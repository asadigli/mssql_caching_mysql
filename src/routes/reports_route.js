const express = require('express')
const router = express.Router()
const {
  salesReports,
  monthlySales
} = require("../controllers/reports/Sales")


router.get('/sales', salesReports);

router.get('/monthly-sales', monthlySales);


module.exports = router