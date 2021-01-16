const configDB = require('../config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { Customer, createCustomer, validateUser: validateCustomerUser } = require('../models/customer');


async function handleCustomerRegisteration(request, response) {

    const { error, value } = validateCustomerUser(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let user = await Customer.findOne({ phoneNumber: request.body.phoneNumber });
    if (user) return response.status(400).send({
        "_id": user._id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "phoneNumber": user.phoneNumber, // We should also send a token here.
        "error": "Already exists."
    }); // USER ALREADY EXISTS. ==> ASK IS THAT YOU?

    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createCustomer(request, response);
}


async function handleUpdateData(request, response) {

    const { error, value } = validateUpdateCustomer(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const { error2, value2 } = validateObjectId(request);
    if (error2) return response
        .status(400)
        .send({ "error": error2.details[0].message });

    let user = await Customer.findOne({ _id: request.params.id });
    if (!user) return response.status(400).send({
        "error": "User doesnt exist."
    });

    try {
        const result = await user.updateOne({
            firstName: request.body.firstName,
            lastName: request.body.lastName
        });
        response.status(200).send("OK");
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}




function validateUpdateCustomer(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(5).max(20).required(),
        lastName: Joi.string().min(5).max(20).required()
    });
    return validationSchema.validate(request.body);

}


function validateObjectId(request) {
    // Validation
    const validationSchema = Joi.object({
        id: Joi.objectId().required()
    });
    return validationSchema.validate(request.params);

}

module.exports = {
    handleCustomerRegisteration: handleCustomerRegisteration,
    handleUpdateData: handleUpdateData
};