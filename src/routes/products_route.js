const express = require('express')
const router = express.Router()
const {
  brands,
  parents,
  priceTypes,
  prices,
  quantities,
  list
} = require("../controllers/Products")

router.get('/brands', brands);

router.get('/parents', parents);

router.get('/price-types', priceTypes);

router.get('/prices', prices);

router.get('/quantities', quantities);

router.get('/', list);

module.exports = router