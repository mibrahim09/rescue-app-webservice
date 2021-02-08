const { request } = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const { required } = require('joi');

/*['Ain Sokhna', 'Alexandria', 'Aswan', 'Asyut', 'Banha', 'Beheira', 'Beni Suef', 'Cairo',
        'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Hurghada', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Mansoura', 
        'Marsa Alam', 'Matruh', 'Minya', 'Monufia', 'New Valley', "North Coast", 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 
        'Quseer', 'Ras Ghareb', 'Red Sea', 'Safaga', 'Sharm El-Sheikh', 'Sharqia', 'Sohag', 'South Sinai', 'Suez', 'Tanta']*/
/*[
    'الإسكندرية', 'مطروح', 'الساحل الشمالي', 'البحيرة', 'كفر الشيخ', 'طنطا', 'المنصورة','بنها'
        , 'دمياط', 'الشرقية', 'المنوفية', 'الاسماعيلية',
        'بورسعيد', 'السويس', 'السخنة', 'الغردقة', 'شرم الشيخ', 'قنا', 'سوهاج'
        , 'اسيوط','اسوان', 'المنيا', 'بني سويف', 'الفيوم',
        'الوادي الجديد', 'راس غارب', 'سفاجا', 'القصير', 'مرسى علم'
]*/

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
        maxlength: 20,
        match: /[a-zA-Z]|[ء-ي]/
    },
    lastName: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 3,
        maxlength: 20,
        match: /[a-zA-Z]|[ء-ي]/
    },
    winchPlates: {
        type: String,
        required: function() { return this.isMobileVerified; },
        minlength: 4,
        maxlength: 7,
        match: /([0-9][ء-ي])|([ء-ي][0-9])/
    },
    governorate:{
        type: String,
        enum: ['Ain Sokhna', 'Alexandria', 'Aswan', 'Asyut', 'Banha', 'Beheira', 'Beni Suef', 'Cairo',
        'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Hurghada', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Mansoura', 
        'Marsa Alam', 'Matruh', 'Minya', 'Monufia', 'New Valley', "North Coast", 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 
        'Quseer', 'Ras Ghareb', 'Red Sea', 'Safaga', 'Sharm El-Sheikh', 'Sharqia', 'Sohag', 'South Sinai', 'Suez', 'Tanta',
        'الإسكندرية', 'مطروح', 'الساحل الشمالي', 'البحيرة', 'كفر الشيخ', 'طنطا', 'المنصورة','بنها'
        , 'دمياط', 'الشرقية', 'المنوفية', 'الاسماعيلية',
        'بورسعيد', 'السويس', 'السخنة', 'الغردقة', 'شرم الشيخ', 'قنا', 'سوهاج'
        , 'اسيوط','اسوان', 'المنيا', 'بني سويف', 'الفيوم',
        'الوادي الجديد', 'راس غارب', 'سفاجا', 'القصير', 'مرسى علم'],
        required: function() { return this.isMobileVerified; }
    },
    /*locationsCovered:{
        0: {
            locations: [{
                type: String, 
                enum: ["Cairo Desert Road", "Cairo Agriculture Road"],
                default: null
                } ]
            },
        1: {
            locations: [{
                type: String, 
                enum: ["Alexandria Desert Road", "Alexandria Agriculture Road", "North Coast"],
                default: null
                } ]
            }
    },*/
    
    /*
    locationsCovered:{
         type: String, 
         enum: ["Alexandria Desert Road", "Alexandria Agriculture Road", "North Coast"],
         validate: { validator : function() {
                return this.city = 'Alexandria' ;
         },
         message : "Cairo doesn't have locations"
        }
    },*/
    /*location: {
        1: {
            city: {
                type: String,
                value : 'Alexandria',
                required: function() { return this.isMobileVerified; }

                },
            locationsCovered: {
                type: [String], 
                enum: ["Alexandria Desert Road", "Alexandria Agriculture Road", "North Coast"],
                default: null
                } 
            }
    },*/
    
    personalPicture: { type: String },
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
        governorate: this.governorate
        //locationsCovered: this.locationsCovered
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
        response.status(200).send({"token": token});
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