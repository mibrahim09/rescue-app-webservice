const firebase = require('./firebase');
const configDB = require('../config');
const Joi = require('joi');
const _ = require('lodash');
const { MechanicCenter, createMechanicCenter,  validatePhone } = require('../models/mechanicCenters');
const { CentersCars, createCar, validateCar } = require('../models/centersCars');
const { request } = require('express');

async function handleMechanicCenterRegisteration(request, response) {

    const { error, value } = validatePhone(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const msg = await firebase.validateCustomerPhone(request);
    if (msg !== "OK") {
        return response.status(400).send({
            "error": msg
        });
    }

    let mechanicCenter = await MechanicCenter.findOne({ phoneNumber: request.body.phoneNumber });
    if (mechanicCenter) {
        verified = false;
        if (mechanicCenter.name && mechanicCenter.governorate)
            verified = true;
        var result = await mechanicCenter.generateAuthToken(verified);
        if (verified)
            // USER ALREADY EXISTS and has a first or last name. Send them
            return response.status(200).send({ "token": result, "name": mechanicCenter.name, "governorate": mechanicCenter.governorate });
        else
            // USER ALREADY EXISTS. ==> but no first or last name.
            return response.status(200).send({ "token": result }); // USER ALREADY EXISTS. ==> ASK IS THAT YOU?
    }

    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createMechanicCenter(request, response);

}

async function handleUpdateData(request, response) {

    const language = request.header('language');

    if (language == 'en') {
        const { error, value } = validateUpdateMechanicCenter(request); 
    if (error) return response.status(400).send({ "error": error.details[0].message})
    };

    if (language == 'ar') {
        const { error, value } = validateArabicUpdateMechanicCenter(request); 
    if (error) return response.status(400).send({ "خطأ" : error.details[0].message})
    };

    let mechanicCenter = await MechanicCenter.findOne({ _id: request.mechanicCenter._id });
    if (!mechanicCenter) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {
    const result = await MechanicCenter.findByIdAndUpdate(
        { _id: request.mechanicCenter._id },// filter
        {
            $set:{
                isMobileVerified: true,
                name: request.body.name,
                governorate: request.body.governorate
            }  
        },
        {
            new: true
        });

        const newToken = await result.generateAuthToken(true);// NEW TOKEN with the rest of data set.
        response.status(200).send({ "token": newToken });
        }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

async function handleRestOfDataAfterApproval(request, response) {
    const { error, value } = validateUpdateMechanicCenterAfterApproval(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let mechanicCenter = await MechanicCenter.findOne({ _id: request.mechanicCenter._id });
    if (!mechanicCenter) return response.status(400).send({
        "error": "User doesn't exist."
    });

    if (!mechanicCenter.approvalState) return response.status(400).send("Error !");

    try {
        const result = await mechanicCenter.updateOne({
            centerState: request.body.centerState
        });
        response.status(200).send("Done");
    }
    catch (ex) {
        response.status(400).send("error");
    }
}

async function handleInsertCar(request, response) {

    try {
        const { error, value } = validateCar(request);
        if (error) return response
            .status(400)
            .send({ "error": error.details[0].message });

        await createCar(request, response);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}
async function getCars(request, response) {

    try {
        let result = await CentersCars.find({
            'OwnerId': {
                $in: [
                    mongoose.Types.ObjectId(request.mechanicCenter._id)
                ]
            }
        }, function (err, docs) {
            console.log(docs);
        });
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}


function validateUpdateMechanicCenter(request) {
    // Validation
    const validationSchema = Joi.object({
        name: Joi.string().min(2).max(20).regex(/[a-zA-Z]|[ء-ي]/).required()
        .label('name')
        .messages({
            'string.base': `{#label} should be a type of 'text'`,
            'string.empty': `Please Enter Your {#label}`,
            'string.min': '{#label} should have a minimum length of {#limit}',
            'string.pattern.base': `{#label} should contain only letters`,
            'any.required': `Please Enter Your {#label}`
          }),
        governorate: Joi.string().valid('Ain Sokhna', 'Alexandria', 'Aswan', 'Asyut', 'Banha', 'Beheira', 'Beni Suef', 'Cairo',
        'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Hurghada', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Mansoura', 
        'Marsa Alam', 'Matruh', 'Minya', 'Monufia', 'New Valley', "North Coast", 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 
        'Quseer', 'Ras Ghareb', 'Red Sea', 'Safaga', 'Sharm El-Sheikh', 'Sharqia', 'Sohag', 'South Sinai', 'Suez', 'Tanta').required()
    });
    return validationSchema.validate(_.pick(request.body, ['name', 'governorate']));

}

// Untill I find a Translator Method
function validateArabicUpdateMechanicCenter(request) {
    // Validation
    const validationSchema = Joi.object({
        name: Joi.string().min(2).max(20).regex(/[ء-ي]/).required()
        .messages({
            'string.empty': `من فضلك ادخل اسمك`,
            'string.min': 'يجب ان يكون اسمك حرفين على الاقل',  
            'string.pattern.base': `يجب ان يحتوي اسمك على حروف عربية فقط`,
            'any.required': `من فضلك ادخل اسمك`
          }),
        governorate: Joi.string().valid('الإسكندرية', 'مطروح', 'الساحل الشمالي', 'البحيرة', 'كفر الشيخ', 'طنطا', 'المنصورة','بنها'
        , 'دمياط', 'الشرقية', 'المنوفية', 'الاسماعيلية',
        'بورسعيد', 'السويس', 'السخنة', 'الغردقة', 'شرم الشيخ', 'قنا', 'سوهاج'
        , 'اسيوط','اسوان', 'المنيا', 'بني سويف', 'الفيوم',
        'الوادي الجديد', 'راس غارب', 'سفاجا', 'القصير', 'مرسى علم').required()
        .messages({
            'string.empty': `من فضلك ادخل المحافظة`,
            'any.only': 'يجب ان تكون محافظة من تلك القائمة {#valids}',
            'any.required': `من فضلك ادخل المحافظة`
          })

    });
    return validationSchema.validate(_.pick(request.body, ['name', 'governorate']));

}


function validateUpdateMechanicCenterAfterApproval(request) {
    // Validation
    const validationSchema = Joi.object({
        centerState:Joi.string().valid('Offline','Idle','Busy').required()
    });
    return validationSchema.validate(_.pick(request.body, ['centerState']));

}

module.exports = {
    handleMechanicCenterRegisteration: handleMechanicCenterRegisteration,
    handleUpdateData: handleUpdateData,
    handleRestOfDataAfterApproval: handleRestOfDataAfterApproval,
    getCars: getCars,
    handleInsertCar: handleInsertCar
};