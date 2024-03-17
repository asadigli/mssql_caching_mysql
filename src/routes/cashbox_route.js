const { Router } = require('express')
const express = require('express')
const router = express.Router()
const {
  allList
} = require("../controllers/payments/Cashbox")

const {
  payment_types,
  payment_groups
} = require("../controllers/payments/Properties")

const {
  payment_history,
  paymentsDaily
} = require("../controllers/payments/All")

router.get("/payments",payment_history);

router.get("/payments/daily",paymentsDaily);

router.get("/all", allList);

router.get("/payments/types", payment_types);

router.get("/payments/groups", payment_groups);


module.exports = router