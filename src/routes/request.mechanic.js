const router = require("express").Router();
const auth = require('../middleware/auth.user.requests');
const requestHandler = require('../controllers/request.mechanic');
// const request = require('../controllers/mechanic.services');


router.post('/createrequest', auth, async (req, res) => {
    requestHandler.handleCustomerNewRequest(req, res);
});

router.get('/checkstatus', auth, async (req, res) => {
    requestHandler.handleCheckRideStatus(req, res);
});

router.post('/CustomerResponse', auth, async (req, res) => {
    requestHandler.handleCustomerResponse(req, res);
});

router.get('/cancelride', auth, async (req, res) => {
    requestHandler.handleCancelRide(req, res);
});

router.post('/Rate', auth, async (req, res) => {
    requestHandler.handleCustomer2MechanicRating(req, res);
});

router.get('/GetAllServices', async (req, res) => {
    requestHandler.handleGetAllServices(req, res);
});

router.get('/loadRepairsToBeMade', auth, async (req, res) => {
    requestHandler.LoadRepairsToBeMadeToCustomer(req, res);
});



module.exports = router;