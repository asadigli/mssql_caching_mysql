const express = require('express')
const router = express.Router()
const {
  list,
  groups
} = require("../controllers/customers/All")

// const {
//   allAccounts
// } = require("../controllers/customers/Accounts")

// router.use((req, res, next) => {
// //   console.log('Time: ', Date.now())
//   next()
// });


router.get('/', list);

// router.get('/groups', groups);

// router.get('/accounts', allAccounts);


module.exports = router