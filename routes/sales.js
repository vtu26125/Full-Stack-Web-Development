const router = require('express').Router();
const sales = require('../controllers/sales');

router.get('/', sales.getAll);
router.get('/product/:productId', sales.getByProduct);
router.post('/', sales.create);

module.exports = router;
