const firebase = require('../controllers/firebase');
const configDB = require('../config');
const Joi = require('joi');
const _ = require('lodash');
const { Driver, createWinchUser,  validatePhone } = require('../models/winchDriver');
const { request } = require('express');

async function handleWinchDriverRegisteration(request, response) {

    const { error, value } = validatePhone(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    /*const msg = await firebase.validateCustomerPhone(request);
    if (msg !== "OK") {
        return response.status(400).send({
            "error": msg
        });
    }*/

    let driver = await Driver.findOne({ phoneNumber: request.body.phoneNumber });
    if (driver) {

        var result = await driver.generateAuthToken();
        return response.status(200).send(`USER ALREADY EXISTS\r\nYour Token : ${result}`); // USER ALREADY EXISTS. ==> ASK IS THAT YOU?
    }

    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createWinchUser(request, response);

}

async function handleUpdateData(request, response) {
    const { error, value } = validateUpdateDriver(request); 
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let driver = await Driver.findOne({ _id: request.driver._id }); //_id: request.params.id
    if (!driver) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {
    const result = await Driver.findByIdAndUpdate(
        { _id: request.driver._id },// filter
        {
            $set:{
                isMobileVerified: true,
                firstName: request.body.firstName,
                lastName: request.body.lastName,
                winchPlates: request.body.winchPlates,
                city: request.body.city, 
                locationsCovered: request.body.locationsCovered
                /*if (request.body.locationsCovered) {
                    locationsCovered: Array.isArray(request.body.locationsCovered) ? request.body.locationsCovered : [request.body.locationsCovered];
                    } */
                //"locationsCovered": ["Alexandria Desert Road", "Alexandria Agriculture Road"]
            }  
        },
        {
            new: true
        });

        const newToken = await result.generateAuthToken();// NEW TOKEN with the rest of data set.
        response.status(200).send({ "New Token": newToken });
        }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function handleRestOfImageData(request, response) {
    let driver = await Driver.findOne({ _id: request.driver._id });
    if (!driver) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {
        const result = await Driver.findOneAndUpdate(
            { _id: request.driver._id },// filter
            {
            personalPicture: request.files[0].path,
            driverLicensePicture: request.files[1].path,
            winchLicenseFrontPicture: request.files[2].path,
            winchLicenseRearPicture: request.files[3].path,
            driverCriminalRecordPicture: request.files[4].path,
            driverDrugAnalysisPicture: request.files[5].path,
            winchCheckReportPicture: request.files[6].path

            //For Testing
            //approvalState: true
            },
            {
                new: true
            });
            
        const newToken = await result.generateFinalAuthToken();// NEW TOKEN with the rest of data set.
        response.status(200).send({ "New Token": newToken });
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

async function handleRestOfDataAfterApproval(request, response) {
    const { error, value } = validateUpdateDriverAfterApproval(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let driver = await Driver.findOne({ _id: request.driver._id });
    if (!driver) return response.status(400).send({
        "error": "User doesn't exist."
    });

    if (!driver.approvalState) return response.status(400).send("Error !");

    try {
        const result = await driver.updateOne({
            winchState: request.body.winchState
        });
        response.status(200).send("Done");
    }
    catch (ex) {
        response.status(400).send("error");
    }
}

function validateUpdateDriver(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(20).regex(/[a-zA-Z]|[ء-ي]/).required(),
        lastName: Joi.string().min(2).max(20).regex(/[a-zA-Z]|[ء-ي]/).required(),
        winchPlates: Joi.string().min(4).max(7).regex(/([0-9][ء-ي])|([ء-ي][0-9])/).required(),
        city:Joi.string().valid('Cairo','Alexandria').required()
        //, 'city'
        //locationsCovered: Joi.string().valid("Alexandria Desert Road", "Alexandria Agriculture Road", "North Coast")
        //, 'locationsCovered'

        //Postman
        //"locationsCovered": "Alexandria Desert Road"
    });
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName', 'winchPlates', 'city']));

}

function validateUpdateDriverAfterApproval(request) {
    // Validation
    const validationSchema = Joi.object({
        winchState:Joi.string().valid('Offline','Idle','Busy').required()
    });
    return validationSchema.validate(_.pick(request.body, ['winchState']));

}

module.exports = {
    handleWinchDriverRegisteration: handleWinchDriverRegisteration,
    handleUpdateData: handleUpdateData,
    handleRestOfImageData: handleRestOfImageData,
    handleRestOfDataAfterApproval: handleRestOfDataAfterApproval
};