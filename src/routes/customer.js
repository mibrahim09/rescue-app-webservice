const router = require("express").Router();
const customerHandler = require('../controllers/customer');
const auth = require('../middleware/authnewuser');

// /api/customer/:id
router.post('/me/updateprofile', auth, async(req, res) => {
    customerHandler.handleUpdateData(req, res);
});

module.exports = router;
