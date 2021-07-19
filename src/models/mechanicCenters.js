const { request } = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');
const { required } = require('joi');

const mechanicCentersSchema = mongoose.Schema({
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
    name: {
        type: String,
        required: function () { return this.isMobileVerified; },
        minlength: 2,
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
    mechanics: [{
        type: mongoose.SchemaTypes.ObjectId,
        unique: true
    }],
    approvalState: {
        type: Boolean,
        default: false
    },
    centerState: {
        type: String,
        //required: function() { return this.approvalState; },
        enum: ['Offline', 'Idle', 'Busy'],
        default: 'Offline'
    }
});

mechanicCentersSchema.methods.generateAuthToken = function (verified) {
    const token = jwt.sign({
        _id: this._id,
        //name: this.name,
        //governorate: this.governorate
        verified: verified,
        user_type: "mechanic_centers"
    }, config.get('jwtPrivateKey'));
    return token;
}

const MechanicCenter = mongoose.model('mechanic_centers', mechanicCentersSchema);

function validatePhone(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(13).regex(/(\+)(201)[0-9]{9}/).required(),
        fireBaseId: Joi.string().required()
    });
    return validationSchema.validate(request.body);

}
async function createMechanicCenter(request, response) {
    const mechanicCenter = new MechanicCenter({
        phoneNumber: request.body.phoneNumber
    });
    try {
        const mechanicCenterPromise = await mechanicCenter.save();
        const token = await mechanicCenter.generateAuthToken(false);
        response.status(200).send({ "token": token });
    }
    catch (ex) {
        response.status(400).send(ex.message);
    }
}
module.exports = {
    MechanicCenter: MechanicCenter,
    createMechanicCenter: createMechanicCenter,
    validatePhone: validatePhone
};