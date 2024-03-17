const express = require('express')
const router = express.Router()
const {
  // branches,
  currencies,
  employees
  // checkAccess
} = require("../controllers/General")


// router.get('/branches', branches);

router.get('/employees', employees);

router.get('/currencies', currencies);

// router.get('/check-access', checkAccess);


module.exports = router