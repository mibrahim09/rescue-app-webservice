const firebase = require('../controllers/firebase');
const configDB = require('../config');
const Joi = require('joi');
const _ = require('lodash');
const mongoose = require('mongoose');
//var mergeJSON = require("merge-json");
//Joi.objectId = require('joi-objectid')(Joi);
const { Customer, createCustomer, validatePhone } = require('../models/customer');
const { Cars, createCar, validateCar } = require('../models/cars');

async function handleCustomerRegisteration(request, response) {

    const { error, value } = validatePhone(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const msg = await firebase.validateCustomerPhone(request);
    if (msg !== "OK") {
        return response.status(400).send({
            "error": msg
        });
    }

    let user = await Customer.findOne({ phoneNumber: request.body.phoneNumber });
    if (user) {
        verified = false;
        if (user.firstName && user.lastName)
            verified = true;
        var result = await user.generateAuthToken(verified);
        if (verified)
            // USER ALREADY EXISTS and has a first or last name. Send them
            return response.status(200).send({ "token": result, "firstName": user.firstName, "lastName": user.lastName });
        else
            // USER ALREADY EXISTS. ==> but no first or last name.
            return response.status(200).send({ "token": result });

    }

    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createCustomer(request, response);
}


async function handleUpdateData(request, response) {

    const { error, value } = validateUpdateCustomer(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let user = await Customer.findOne({ _id: request.user._id });

    if (!user) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {

        let result = await Customer.findOneAndUpdate(
            { _id: request.user._id },// filter
            { // updated data
                firstName: request.body.firstName,
                lastName: request.body.lastName
            },
            {
                new: true
            });

        const newToken = await result.generateAuthToken(true);// NEW TOKEN with the first and last name set.
        response.status(200).send({ "token": newToken });
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}


async function handleInsertCar(request, response) {

    try {
        const { error, value } = validateCar(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createCar(request, response);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function getCars(request, response) {

    try {
        let result = await Cars.find({
            'OwnerId': {
                $in: [
                    mongoose.Types.ObjectId(request.user._id)
                ]
            }
        }, function (err, docs) {
            console.log(docs);
        });
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}




function validateUpdateCustomer(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(20).required(),
        lastName: Joi.string().min(2).max(20).required()
    });
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName']));

}


module.exports = {
    handleCustomerRegisteration: handleCustomerRegisteration,
    handleUpdateData: handleUpdateData,
    getCars: getCars,
    handleInsertCar: handleInsertCar
};