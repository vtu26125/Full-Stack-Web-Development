const router = require('express').Router();
const categories = require('../controllers/categories');

router.get('/', categories.getAll);
router.get('/:id', categories.getById);
router.post('/', categories.create);
router.put('/:id', categories.update);
router.delete('/:id', categories.remove);

module.exports = router;
