const router = require("express").Router();
const auth = require('../middleware/auth.mechanic.center.new');
const mechanicCenterHandler = require('../controllers/mechanicCenters');
const authrequest = require('../middleware/auth.mechanic.center.requests');

// /api/mechanicCenter/
router.post('/me/updateprofile', auth, async (req, res) => {
    mechanicCenterHandler.handleUpdateData(req, res);
});

router.post('/me/AfterApproval', auth, async (req, res) => {
    mechanicCenterHandler.handleRestOfDataAfterApproval(req, res);
});

router.post('/me/addCar', authrequest, async(req, res) => {
    mechanicCenterHandler.handleInsertCar(req, res);
});

router.get('/me/cars', authrequest, async(req, res) => {
    mechanicCenterHandler.getCars(req, res);
});

module.exports = router;