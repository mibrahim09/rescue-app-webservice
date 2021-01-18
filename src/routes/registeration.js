const auth = require('../middleware/auth');
const router = require("express").Router();
const customerHandler = require('../controllers/customer');
const winchDriverHandler = require('../controllers/winchUser');
const multer  = require('multer');

const fileStorage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'images');
    },
    filename : (req,file,cb) => {
        cb(null,file.filename + '-' + file.originalname);
    }
});
const upload = multer({storage: fileStorage});

// /api/registeration/customer
router.post('/customer',auth, async(req, res) => {
    customerHandler.handleCustomerRegisteration(req, res);
});

// /api/registeration/winchUser
router.post('/winchUser',upload.single('boat'), async(req, res) => {
    winchDriverHandler.handleWinchDriverRegisteration(req, res);
});

module.exports = router;