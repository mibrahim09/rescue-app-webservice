const router = require("express").Router();
const driverHandler = require('../controllers/winchUser');

// /api/customer/:id
router.post('/:id/updateprofile', (req, res) => {
    driverHandler.handleUpdateData(req, res);
});

module.exports = router;