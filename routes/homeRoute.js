//IMPORT ALL PACKAGES HERE------------------------------
const express = require('express')
const router = express.Router();

//IMPORT ALL CONTROLLERS HERE-
const {home} = require('../controllers/pageController')

//DEFINE ROUTE BELOW-
router.route("/").get(home)


//EXPORT MODULE-------------------------------
module.exports = router;