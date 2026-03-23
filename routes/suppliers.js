const router = require('express').Router();
const suppliers = require('../controllers/suppliers');

router.get('/', suppliers.getAll);
router.get('/:id', suppliers.getById);
router.post('/', suppliers.create);
router.put('/:id', suppliers.update);
router.delete('/:id', suppliers.remove);

module.exports = router;
