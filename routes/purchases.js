const router = require('express').Router();
const purchases = require('../controllers/purchases');

router.get('/', purchases.getAll);
router.get('/product/:productId', purchases.getByProduct);
router.post('/', purchases.create);

module.exports = router;
