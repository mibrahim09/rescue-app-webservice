const router = require("express").Router();
const auth = require('../middleware/auth.driver.requests');
const requestHandler = require('../controllers/request.winch');


router.post('/getNearestClient', auth, async (req, res) => {
    requestHandler.handleDriverRequest(req, res);
});

router.post('/driverResponse', auth, async (req, res) => {
    requestHandler.handleDriverResponse(req, res);
});



module.exports = router;