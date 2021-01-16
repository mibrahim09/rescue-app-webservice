const { request } = require('express');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);// To validate ObjectId.

const mongoose = require('mongoose');

const Customer = mongoose.model('customers_users', new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 20
    },
    lastName: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 20
    },
    phoneNumber: {
        type: String,
        required: true,
        length: 11,
        unique: true
    },
    isMobileVerified: Boolean
}));


function validateUser(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(5).max(20).required(),
        lastName: Joi.string().min(5).max(20).required(),
        phoneNumber: Joi.string().length(11).regex(/^(01)[0-9]{9}$/).required()
        // to confirm valid obj id but not on registeration of course.
        // customerId: Joi.objectId().required() //just an example
    });
    return validationSchema.validate(request.body);

}


async function createCustomerUser(request, response) {
    const customer = new Customer({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        phoneNumber: request.body.phoneNumber
    });
    try {
        const customerPromise = await customer.save();
        response.status(200).send(customerPromise);
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}

async function findExistingCustomer(request, response) {
    const customer = new Customer({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        phoneNumber: request.body.phoneNumber
    });
    try {
        const customerPromise = await customer.save();
        response.status(200).send(customerPromise);
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}

module.exports = {
    Customer: Customer,
    createCustomer: createCustomerUser,
    validateUser: validateUser
};
