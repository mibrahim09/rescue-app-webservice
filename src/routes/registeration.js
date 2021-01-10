const router = require("express").Router();
const customerHandler = require('../controllers/registeration/customer');

// /api/registeration/customer
router.post('/customer', (req, res) => {
    customerHandler.handleCustomerRegisteration(req, res);
});

module.exports = router;