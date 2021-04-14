
const { CarsInfo, createCar, validateCar } = require('../models/carsinfo');

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

module.exports = {
    getAllCars: getAllCars,
    addNewCar: addNewCar
}