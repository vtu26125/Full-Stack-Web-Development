const router = require('express').Router();
const accounts = require('../controllers/accounts');

router.get('/', accounts.getAll);
router.get('/owner', accounts.getOwner);
router.get('/supplier/:supplierId', accounts.getBySupplierId);

module.exports = router;
