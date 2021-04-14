const router = require("express").Router();
const customerHandler = require('../controllers/customer');
const auth = require('../middleware/auth.user.new');
const authrequest = require('../middleware/auth.user.requests');

// /api/customer/:id
router.post('/me/updateprofile', auth, async(req, res) => {
    customerHandler.handleUpdateData(req, res);
});

router.post('/me/car', authrequest, async(req, res) => {
    customerHandler.handleInsertCar(req, res);
});

router.get('/me/car', authrequest, async(req, res) => {
    customerHandler.getCars(req, res);
});

module.exports = router;
