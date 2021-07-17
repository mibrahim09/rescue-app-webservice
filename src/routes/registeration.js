const auth = require('../middleware/auth.user.new');
const router = require("express").Router();
const customerHandler = require('../controllers/customer');
const winchDriverHandler = require('../controllers/winchUser');
const mechanicHandler = require('../controllers/mechanicUser');
const mechanicCenterHandler = require('../controllers/mechanicCenters');

// /api/registeration/customer
router.post('/customer', async (req, res) => {
    customerHandler.handleCustomerRegisteration(req, res);
});

// /api/registeration/winchUser
router.post('/winchUser', async (req, res) => {
    winchDriverHandler.handleWinchDriverRegisteration(req, res);
});

// /api/registeration/mechanicUser
router.post('/mechanicUser', async(req, res) => {
    mechanicHandler.handleMechanicRegisteration(req, res); 
});

// /api/registeration/mechanicCenter
router.post('/mechanicCenter', async(req, res) => {
    mechanicCenterHandler.handleMechanicCenterRegisteration(req, res); 
});

module.exports = router;