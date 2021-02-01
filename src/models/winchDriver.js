const { request } = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

const driverSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        length: 13,
        unique: true
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 2,
        maxlength: 20
    },
    lastName: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 2,
        maxlength: 20
    },
    winchPlates: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 4,
        maxlength: 7
    },
    locationsCovered:{
        type: String
        //required: function() { return this.approvalState; }
    },
    
    personalPicture: {
        type: String
        //required: function() { return this.isMobileVerified; }      
    },
    driverLicensePicture: { type: String },
    winchLicenseFrontPicture: { type: String },
    winchLicenseRearPicture: { type: String },
    driverCriminalRecordPicture: { type: String },
    driverDrugAnalysisPicture: { type: String },
    winchCheckReportPicture: { type: String },
    
    approvalState:{
        type: Boolean,
        default: false
    }, 
    winchState:{
        type: String,
        //required: function() { return this.approvalState; },
        enum: ['Offline','Idle','Busy'],
        default: 'Offline'
    }
});

driverSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        winchPlates: this.winchPlates,
        locationsCovered: this.locationsCovered
    }, config.get('jwtPrivateKey'));
    return token;
}
driverSchema.methods.generateFinalAuthToken = function () {
    const token = jwt.sign({
        _id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        winchPlates: this.winchPlates,
        locationsCovered: this.locationsCovered,
        personalPicture: this.personalPicture,
        driverLicensePicture: this.driverLicensePicture,
        winchLicenseFrontPicture: this.winchLicenseFrontPicture,
        winchLicenseRearPicture: this.winchLicenseRearPicture,
        driverCriminalRecordPicture: this.driverCriminalRecordPicture,
        driverDrugAnalysisPicture: this.driverDrugAnalysisPicture,
        winchCheckReportPicture: this.winchCheckReportPicture
    }, config.get('jwtPrivateKey'));
    return token;
}

const Driver = mongoose.model('winch_users', driverSchema );

function validatePhone(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(13).regex(/(\+)(201)[0-9]{9}/).required(),
        fireBaseId: Joi.string().required()
    });
    return validationSchema.validate(request.body);

}
async function createWinchUser(request, response) {
    const driver = new Driver({
        phoneNumber: request.body.phoneNumber
    });
    try {
        const driverPromise = await driver.save();
        const token =  await driver.generateAuthToken();
        response.status(200).send(token);
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}
    
module.exports = {
    Driver: Driver,
    createWinchUser: createWinchUser,
    validatePhone: validatePhone
};