const config = require('config');
const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');

const carsInfoSchema = mongoose.Schema({
    CarBrand: {
        type: String,
        minlength: 2,
        maxlength: 20
    },
    Model: {
        type: String,
        // required: true,
        minlength: 2,
        maxlength: 20
    },
    StartYear: {
        type: Number,
        min: 1970,
        max: 2025
    },
    
    EndYear: {
        type: Number,
        min: 1970,
        max: 2025
    }
});

const CarsInfo = mongoose.model('admin_cars', carsInfoSchema);


async function createCar(request, response) {
    const car = new CarsInfo({
        CarBrand: request.body.CarBrand,
        Model: request.body.Model,
        StartYear: request.body.StartYear, 
        EndYear: request.body.EndYear

    });
    try {
        const carPromise = await car.save();
        response.status(200).send(car);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

function validateCar(request) {
    // Validation
    const validationSchema = Joi.object({
        CarBrand: Joi.string().max(20).min(2).required(),
        Model: Joi.string().max(20).min(2).required(),
        StartYear: Joi.number().min(1970).max(2025).required(),
        EndYear: Joi.number().min(1970).max(2025).required()
    });
    return validationSchema.validate(request.body);
}

module.exports = {
    CarsInfo: CarsInfo,
    createCar: createCar,
    validateCar: validateCar
};