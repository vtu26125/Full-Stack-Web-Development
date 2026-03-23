const router = require('express').Router();
const brands = require('../controllers/brands');

router.get('/', brands.getAll);

module.exports = router;
