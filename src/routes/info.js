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


router.post('/AddService', async (req, res) => {
    infoHandler.handleAddNewService(req, res);
});

router.get('/GetAllServices', async (req, res) => {
    infoHandler.handleGetAllServices(req, res);
});

router.post('/AddProblem', async (req, res) => {
    infoHandler.handleAddNewProblem(req, res);
});

router.get('/GetAllProblems', async (req, res) => {
    infoHandler.handleGetAllProblems(req, res);
});

router.post('/AddItem', async (req, res) => {
    infoHandler.handleAddNewItem(req, res);
});

router.get('/GetAllItems', async (req, res) => {
    infoHandler.handleGetAllItems(req, res);
});



module.exports = router;
