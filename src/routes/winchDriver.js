const router = require("express").Router();
const auth = require('../middleware/auth.driver.new');
const driverHandler = require('../controllers/winchUser');
const upload = require('../middleware/uploadimages.driver');

// /api/winchDriver/
router.post('/me/updateprofile',auth, async (req, res) => {
    driverHandler.handleUpdateData(req, res);
});

router.post('/me/UploadImages',auth,upload, async(req, res) => {
    driverHandler.handleRestOfImageData(req, res);
},(err,req, res,next) => res.status(404).send({error: err.message}));


router.post('/me/AfterApproval',auth, async(req, res) => {
    driverHandler.handleRestOfDataAfterApproval(req, res);
});

module.exports = router;