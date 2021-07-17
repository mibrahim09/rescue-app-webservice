
const { CarsInfo, createCar, validateCar } = require('../models/carsinfo');
const { Services, createNewService, validateService } = require('../models/services');
const { Problem, createNewProblem, validateProblem } = require('../models/problems');
const { Item, createNewItem, validateServiceItem } = require('../models/items');

async function getAllCars(request, response) {
    try {
        let result = await CarsInfo.find({}, function (err, docs) {
            console.log(docs);
        });
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send(ex);
    }
}

async function addNewCar(request, response) {
    try {
        const { error, value } = validateCar(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createCar(request, response);
    }
    catch (ex) {
        response.status(400).send(ex);
    }
}



async function handleAddNewService(request, response) {

    try {
        const { error, value } = validateService(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createNewService(request, response);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function handleGetAllServices(request, response) {

    try {
        let result = await Services.find();
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}



async function handleAddNewProblem(request, response) {

    try {
        const { error, value } = validateProblem(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createNewProblem(request, response);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function handleGetAllProblems(request, response) {

    try {
        let result = await Problem.find();
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}



async function handleAddNewItem(request, response) {

    try {
        const { error, value } = validateServiceItem(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createNewItem(request, response);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function handleGetAllItems(request, response) {

    try {
        let result = await Item.find();
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}



module.exports = {
    getAllCars: getAllCars,
    addNewCar: addNewCar,
    handleAddNewService: handleAddNewService,
    handleGetAllServices: handleGetAllServices,
    handleAddNewProblem: handleAddNewProblem,
    handleGetAllProblems: handleGetAllProblems,
    handleAddNewItem: handleAddNewItem,
    handleGetAllItems: handleGetAllItems
}