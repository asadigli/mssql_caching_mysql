const express = require('express')
const router = express.Router()
const {
  records
} = require("../controllers/Caching")


router.get('/records', records);


module.exports = router