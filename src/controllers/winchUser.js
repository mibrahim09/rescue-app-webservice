const configDB = require('../config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { Driver, createWinchUser, validateWinchUser: validateWinchUser } = require('../models/winchDriver');


async function handleWinchDriverRegisteration(request, response) {

    const { error, value } = validateWinchUser(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let driver = await Driver.findOne({ phoneNumber: request.body.phoneNumber });
    if (driver) return response.status(400).send({
        "_id": driver._id,
        "firstName": driver.firstName,
        "lastName": driver.lastName,
        "phoneNumber": driver.phoneNumber, // We should also send a token here.
        "error": "Already exists."
    }); // USER ALREADY EXISTS. ==> ASK IS THAT YOU?
    
    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createWinchUser(request, response);
}


async function handleUpdateData(request, response) {

    const { error, value } = validateUpdateDriver(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const { error2, value2 } = validateObjectId(request);
    if (error2) return response
        .status(400)
        .send({ "error": error2.details[0].message });

    let driver = await Customer.findOne({ _id: request.params.id });
    if (!driver) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {
        const result = await driver.updateOne({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            winchState: request.body.winchState
        });
        response.status(200).send("OK");
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

function validateUpdateDriver(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(5).max(20).required(),
        lastName: Joi.string().min(5).max(20).required(),
        //winchState:Joi.string().valid('Offline','Idle','Busy').required()
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
    handleWinchDriverRegisteration: handleWinchDriverRegisteration,
    handleUpdateData: handleUpdateData
};