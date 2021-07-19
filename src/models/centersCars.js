const config = require('config');
const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');

const centersCarSchema = mongoose.Schema({
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
    Year: {
        type: Number,
        min: 1970,
        max: 2025
    },
    CenterId: {
        type: mongoose.SchemaTypes.ObjectId

    },
    Plates: {
        type: String,
        minlength: 4,
        maxlength: 7,
        unique: true,
        match: /([0-9][ء-ي])|([ء-ي][0-9])/
    },
    licensePicture: { type: String },
    Unavailable: {
        type: Boolean,
        default: false
    }
});

const CentersCars = mongoose.model('mechanic_centers_cars', centersCarSchema);


async function createCar(request, response) {
    const car = new CentersCars({
        CarBrand: request.body.CarBrand,
        Model: request.body.Model,
        Year: request.body.Year,
        CenterId: request.mechanicCenter._id,
        Plates: request.body.Plates
    });
    try {
        const carPromise = await car.save();
        response.status(200).send(_.pick(car, ['_id', 'Plates']));
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
        Year: Joi.number().required(),
        Plates: Joi.string().max(7).min(4).regex(/([0-9][ء-ي])|([ء-ي][0-9])/).required()
    });
    return validationSchema.validate(request.body);

}

module.exports = {
    CentersCars: CentersCars,
    createCar: createCar,
    validateCar: validateCar
};