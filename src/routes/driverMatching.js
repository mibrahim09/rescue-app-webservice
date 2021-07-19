const router = require("express").Router();
const auth = require('../middleware/auth.driver.requests');
const requestHandler = require('../controllers/request.winch');


router.post('/getNearestClient', auth, async (req, res) => {
    requestHandler.handleDriverRequest(req, res);
});

router.post('/driverResponse', auth, async (req, res) => {
    requestHandler.handleDriverResponse(req, res);
});

router.post('/liveTracker', auth, async (req, res) => {
    requestHandler.handleUpdateDriverLocation(req, res);
});

router.get('/DriverCancel', auth, async (req, res) => {
    requestHandler.handleDriverCancellation(req, res);
});

router.post('/EndRide', auth, async (req, res) => {
    requestHandler.handleEndRide(req, res);
});

router.post('/Rate', auth, async (req, res) => {
    requestHandler.handleWinch2CustomerRating(req, res);
});


router.post('/driverArrival', auth, async (req, res) => {
    requestHandler.handleDriverResponse(req, res);
});

router.post('/ServiceStart', auth, async (req, res) => {
    requestHandler.handleDriverResponse(req, res);
});



module.exports = router;