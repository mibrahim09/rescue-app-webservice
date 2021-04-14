const { request } = require('express');
const Joi = require('joi');
//Joi.objectId = require('joi-objectid')(Joi);// To validate ObjectId.
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        // required: true,
        minlength: 2,
        maxlength: 20
    },
    lastName: {
        type: String,
        // required: true,
        minlength: 2,
        maxlength: 20
    },
    phoneNumber: {
        type: String,
        required: true,
        length: 13,
        unique: true
    },
    isMobileVerified: Boolean
});

userSchema.methods.generateAuthToken = function (verified) {
    const token = jwt.sign({
        _id: this._id,
        // firstName: this.firstName,
        // lastName: this.lastName,
        verified: verified,
        user_type: "customer"
    }, config.get('jwtPrivateKey'));
    return token;
}

const Customer = mongoose.model('customers_users', userSchema);

function validatePhone(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(13).regex(/(\+)(201)[0-9]{9}/).required(),
        fireBaseId: Joi.string().required()
    });
    return validationSchema.validate(request.body);

}


async function createCustomerUser(request, response) {
    const customer = new Customer({
        phoneNumber: request.body.phoneNumber
    });
    try {
        const customerPromise = await customer.save();
        const token = await customer.generateAuthToken(false);
        response.status(200).send({"token": token});
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}

module.exports = {
    Customer: Customer,
    createCustomer: createCustomerUser,
    validatePhone: validatePhone
};
