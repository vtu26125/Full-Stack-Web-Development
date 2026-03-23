const router = require('express').Router();
const models = require('../controllers/models');

router.get('/', models.getAll);

module.exports = router;
