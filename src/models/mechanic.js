const { request } = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const { required } = require('joi');

const mechanicSchema = mongoose.Schema({
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
        required: function () { return this.isMobileVerified; },
        minlength: 2,
        maxlength: 20,
        match: /[a-zA-Z]|[ء-ي]/
    },
    lastName: {
        type: String,
        required: function () { return this.isMobileVerified; },
        minlength: 3,
        maxlength: 20,
        match: /[a-zA-Z]|[ء-ي]/
    },
    governorate: {
        type: String,
        enum: ['Ain Sokhna', 'Alexandria', 'Aswan', 'Asyut', 'Banha', 'Beheira', 'Beni Suef', 'Cairo',
            'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Hurghada', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Mansoura',
            'Marsa Alam', 'Matruh', 'Minya', 'Monufia', 'New Valley', "North Coast", 'North Sinai', 'Port Said', 'Qalyubia', 'Qena',
            'Quseer', 'Ras Ghareb', 'Red Sea', 'Safaga', 'Sharm El-Sheikh', 'Sharqia', 'Sohag', 'South Sinai', 'Suez', 'Tanta',
            'الإسكندرية', 'مطروح', 'الساحل الشمالي', 'البحيرة', 'كفر الشيخ', 'طنطا', 'المنصورة', 'بنها'
            , 'دمياط', 'الشرقية', 'المنوفية', 'الاسماعيلية',
            'بورسعيد', 'السويس', 'السخنة', 'الغردقة', 'شرم الشيخ', 'قنا', 'سوهاج'
            , 'اسيوط', 'اسوان', 'المنيا', 'بني سويف', 'الفيوم',
            'الوادي الجديد', 'راس غارب', 'سفاجا', 'القصير', 'مرسى علم'],
        required: function () { return this.isMobileVerified; }
    },
    personalPicture: { type: String },
    balance: {
        type: Number,
        default: 0,
        set: function (v) { return Math.round(v); } //Not Tested Yet
    },
    approvalState: {
        type: Boolean,
        default: false
    },
    mechanicState: {
        type: String,
        //required: function() { return this.approvalState; },
        enum: ['Offline', 'Idle', 'Busy'],
        default: 'Offline'
    }
});

mechanicSchema.methods.generateAuthToken = function (verified) {
    const token = jwt.sign({
        _id: this._id,
        //firstName: this.firstName,
        //lastName: this.lastName,
        //governorate: this.governorate
        verified: verified,
        user_type: "mechanic"
    }, config.get('jwtPrivateKey'));
    return token;
}
mechanicSchema.methods.generateFinalAuthToken = function (verified) {
    const token = jwt.sign({
        _id: this._id,
        //firstName: this.firstName,
        //lastName: this.lastName,
        //personalPicture: this.personalPicture
        verified: verified,
        user_type: "mechanic"
    }, config.get('jwtPrivateKey'));
    return token;
}

const Mechanic = mongoose.model('mechanic_users', mechanicSchema);

function validatePhone(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(13).regex(/(\+)(201)[0-9]{9}/).required()
        //fireBaseId: Joi.string().required()
    });
    return validationSchema.validate(request.body);

}
async function createMechanicUser(request, response) {
    const mechanic = new Mechanic({
        phoneNumber: request.body.phoneNumber
    });
    try {
        const mechanicPromise = await mechanic.save();
        const token = await mechanic.generateAuthToken(false);
        response.status(200).send({ "token": token });
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}
module.exports = {
    Mechanic: Mechanic,
    createMechanicUser: createMechanicUser,
    validatePhone: validatePhone
};