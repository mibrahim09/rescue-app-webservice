const router = require("express").Router();
const auth = require('../middleware/auth.mechanic.requests');
const requestHandler = require('../controllers/request.mechanic');
//const request = require('../controllers/mechanic.services');


router.post('/getNearestClient', auth, async (req, res) => {
    requestHandler.handleMechanicRequest(req, res);
});

router.post('/MechanicResponse', auth, async (req, res) => {
    requestHandler.handleMechanicResponse(req, res);
});

router.get('/checkstatus', auth, async (req, res) => {
    requestHandler.handleCheckMechanicStatus(req, res);
});

router.get('/MechanicCancel', auth, async (req, res) => {
    requestHandler.handleMechanicCancellation(req, res);
});

router.post('/liveTracker', auth, async (req, res) => {
    requestHandler.handleUpdateMechanicLocation(req, res);
});

router.post('/EndRide', auth, async (req, res) => {
    requestHandler.handleEndRide(req, res);
});

router.post('/Rate', auth, async (req, res) => {
    requestHandler.handleMechanic2CustomerRating(req, res);
});

router.post('/MechanicArrival', auth, async (req, res) => {
    requestHandler.handleMechanicResponse(req, res);
});


router.post('/ChooseRepairs', auth, async (req, res) => {
    requestHandler.GetFromMechRepairsToBeMade(req, res);
});

router.post('/ServiceStart', auth, async (req, res) => {
    requestHandler.handleMechanicResponse(req, res);
});

router.get('/availableCars', auth, async (req, res) => {
    requestHandler.getAllAvailableCars(req, res);
});



module.exports = router;