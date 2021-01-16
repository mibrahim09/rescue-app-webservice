const router = require("express").Router();
const customerHandler = require('../controllers/customer');
const winchDriverHandler = require('../controllers/winchUser');

// /api/registeration/customer
router.post('/customer', (req, res) => {
    customerHandler.handleCustomerRegisteration(req, res);
});

// /api/registeration/winchUser
router.post('/winchUser', (req, res) => {
    winchDriverHandler.handleWinchDriverRegisteration(req, res);
});

module.exports = router;