const router = require("express").Router();
const infoHandler = require('../controllers/info');
// /api/info/allcars
router.get('/allcars', async (req, res) => {
    infoHandler.getAllCars(req, res);
});

// Just temporary to add some data for testing, in the future it'll require authorization as admin user.
router.post('/allcars', async (req, res) => {
    infoHandler.addNewCar(req, res);
});

module.exports = router;
