//const auth = require('../middleware/auth');
const router = require("express").Router();
const customerHandler = require('../controllers/customer');

// /api/customer/:id
router.post('/:id/updateprofile', async(req, res) => {
    customerHandler.handleUpdateData(req, res);
});

module.exports = router;
