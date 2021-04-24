const router = require("express").Router();
const auth = require('../middleware/auth.user.requests');
const requestHandler = require('../controllers/request.winch');


router.post('/createrequest', auth, async (req, res) => {
    requestHandler.handleCustomerNewRequest(req, res);
});

router.get('/checkstatus', auth, async (req, res) => {
    requestHandler.handleCheckRideStatus(req, res);
});

router.get('/cancelride', auth, async (req, res) => {
    requestHandler.handleCancelRide(req, res);
});

router.post('/Rate', auth, async (req, res) => {
    requestHandler.handleCustomer2WinchRating(req, res);
});

module.exports = router;