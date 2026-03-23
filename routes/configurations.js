const router = require('express').Router();
const configurations = require('../controllers/configurations');

router.get('/', configurations.getAll);

module.exports = router;
