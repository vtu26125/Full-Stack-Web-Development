const router = require('express').Router();
const productTypes = require('../controllers/productTypes');

router.get('/', productTypes.getAll);

module.exports = router;
