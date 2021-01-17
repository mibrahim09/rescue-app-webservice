const { request } = require('express');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);// To validate ObjectId.

const mongoose = require('mongoose');

const Driver = mongoose.model('winch_users', new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        length: 11,
        unique: true
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 3,
        maxlength: 20
    },
    lastName: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 3,
        maxlength: 20
    },
    winchPlates: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 4,
        maxlength: 7
    },
    /*
    personalPicture: {
        type: String,
        required: function() { return this.isMobileVerified; },
        validate:{
            validator: function(v){

            },
        }       
    }, */
    //driverLicensePicture: {},
    //winchLicenseFrontPicture: {},
    //winchLicenseRearPicture: {},
    //driverCriminalRecordPicture: {},
    //driverDrugAnalysisPicture: {},
    //winchCheckReportPicture: {},
    approvalState:{
        type: Boolean,
        default: false
    }, 
    winchState:{
        type: String,
        required: function() { return this.approvalState; },
        enum: ['Offline','Idle','Busy']
    },
    locationsCovered:{
        type: String,
        required: function() { return this.approvalState; }
    }
}));


function validateWinchUser(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(11).regex(/^(01)[0-9]{9}$/).required(),
        firstName: Joi.string().min(2).max(10).required(),
        lastName: Joi.string().min(2).max(10).required(),
        winchPlates: Joi.string().alphanum().min(4).max(7).required(),
        personalPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required()

        //driverLicensePicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchLicenseFrontPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchLicenseRearPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //driverCriminalRecordPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //driverDrugAnalysisPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchCheckReportPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
          
        // to confirm valid obj id but not on registeration of course.
        // customerId: Joi.objectId().required() //just an example
    });
    return validationSchema.validate(request.body);

}
async function createWinchUser(request, response) {
    const driver = new Driver({
        phoneNumber: request.body.phoneNumber,
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        winchPlates: request.body.winchPlates,
        personalPicture: request.body.personalPicture

        //driverLicensePicture: ,
        //winchLicenseFrontPicture: ,
        //winchLicenseRearPicture: ,
        //driverCriminalRecordPicture: ,
        //driverDrugAnalysisPicture: ,
        //winchCheckReportPicture:  
    });
    try {
        const driverPromise = await driver.save();
        response.status(200).send(driverPromise);
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}

module.exports = {
    Driver: Driver,
    createWinchUser: createWinchUser,
    validateWinchUser: validateWinchUser
};