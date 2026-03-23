const router = require('express').Router();
const productConfigs = require('../controllers/productConfigs');

router.get('/', productConfigs.getAll);

module.exports = router;
