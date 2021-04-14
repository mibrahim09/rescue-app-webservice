const router = require("express").Router();
const auth = require('../middleware/auth.user.requests');
const requestHandler = require('../controllers/request.winch');


router.post('/createrequest', auth, async (req, res) => {
    requestHandler.handleCustomerNewRequest(req, res);
});
router.get('/checkstatus', auth, async (req, res) => {
    requestHandler.handleCheckRideStatus(req, res);
});

module.exports = router;