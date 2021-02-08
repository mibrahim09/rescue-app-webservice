const router = require("express").Router();
const auth = require('../middleware/authnewmechanic');
const mechanicHandler = require('../controllers/mechanicUser');
const upload = require('../middleware/UploadMechanicImage');

// /api/mechanic/
router.post('/me/updateprofile',auth, async (req, res) => {
    mechanicHandler.handleUpdateData(req, res);
});

router.post('/me/UploadImage',auth,upload, async(req, res) => {
    mechanicHandler.handleRestOfImageData(req, res);
},(err,req, res,next) => res.status(404).send({error: err.message}));


router.post('/me/AfterApproval',auth, async(req, res) => {
    mechanicHandler.handleRestOfDataAfterApproval(req, res);
});

module.exports = router;