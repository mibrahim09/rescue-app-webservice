const firebase = require('../controllers/firebase');
const configDB = require('../config');
const Joi = require('joi');
const _ = require('lodash');
const { Mechanic, createMechanicUser, validatePhone } = require('../models/mechanic');
const { MechanicCenter } = require('../models/mechanicCenters');
const { request } = require('express');

async function handleMechanicRegisteration(request, response) {
    const { error, value } = validatePhone(request);
    if (error) return response.status(400).send({ "error": error.details[0].message });
    const msg = await firebase.validateCustomerPhone(request);
    if (msg !== "OK") {
        return response.status(400).send({
        "error": msg
         });
        }
    let mechanic = await Mechanic.findOne({ phoneNumber: request.body.phoneNumber });
    if (mechanic) {
        verified = false;
        if (mechanic.firstName && mechanic.lastName && mechanic.governorate && mechanic.personalPicture)
            verified = true;
        var result = await mechanic.generateAuthToken(verified);
        if (verified)
            // USER ALREADY EXISTS and has a first or last name. Send them
            return response.status(200).send({ "token": result, "firstName": mechanic.firstName, "lastName": mechanic.lastName, "governorate": mechanic.governorate });
        else
            // USER ALREADY EXISTS. ==> but no first or last name.
            return response.status(200).send({ "token": result }); // USER ALREADY EXISTS. ==> ASK IS THAT YOU?
    }
    await createMechanicUser(request, response);
}
async function handleUpdateData(request, response) {
    const language = request.header('language');
    if (language == 'en') {
        const { error, value } = validateUpdateMechanic(request);
        if (error) return response.status(400).send({ "error": error.details[0].message })
    }
    else if (language == 'ar') {
        const { error, value } = validateArabicUpdateMechanic(request);
        if (error) return response.status(400).send({ "خطأ": error.details[0].message })
    }
    let mechanic = await Mechanic.findOne({ _id: request.mechanic._id });
    if (!mechanic) return response.status(400).send({ "error": "User doesn't exist." });
    try {
        const result = await Mechanic.findByIdAndUpdate(
            { _id: request.mechanic._id },// filter
            {
                $set: {
                    isMobileVerified: true,
                    firstName: request.body.firstName,
                    lastName: request.body.lastName,
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

async function handleRestOfImageData(request, response) {
    let mechanic = await Mechanic.findOne({ _id: request.mechanic._id });
    if (!mechanic) return response.status(400).send({ "error": "User doesn't exist." });
    try {
        const result = await Mechanic.findOneAndUpdate(
            { _id: request.mechanic._id },// filter
            {
                personalPicture: request.file.path
            },
            {
                new: true
            });

        const newToken = await result.generateFinalAuthToken(true);// NEW TOKEN with the rest of data set.
        response.status(200).send({ "token": newToken });
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

async function handleRestOfData(request, response) {

    const { error, value } = validateUpdateMechanicOptionalData(request);
    if (error) return response.status(400).send({ "error": error.details[0].message });
    let mechanic = await Mechanic.findOne({ _id: request.mechanic._id });
    if (!mechanic) return response.status(400).send({ "error": "User doesn't exist." });
    try {
        const result = await Mechanic.findOneAndUpdate(
            { _id: request.mechanic._id },// filter
            {
                employee: request.body.employee,
                centerId: request.body.centerId
            },
            {
                new: true
            });
        if (request.body.employee == "true") {
            let mechanicCenter = await MechanicCenter.findOne({ _id: result.centerId });
            if (!mechanicCenter) return response.status(400).send({ "error": "Center doesn't exist." });
            const finalResult = await MechanicCenter.findOneAndUpdate(
                { _id: result.centerId },// filter
                { $addToSet: { mechanics: request.mechanic._id } },
                {
                    new: true
                });
        }
        const newToken = await result.generateFinalAuthToken(true);// NEW TOKEN with the rest of data set.
        response.status(200).send({ "token": newToken });
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

async function handleRestOfDataAfterApproval(request, response) {
    const { error, value } = validateUpdateMechanicAfterApproval(request);
    if (error) return response.status(400).send({ "error": error.details[0].message });
    let mechanic = await Mechanic.findOne({ _id: request.mechanic._id });
    if (!mechanic) return response.status(400).send({ "error": "User doesn't exist." });
    if (!mechanic.approvalState) return response.status(400).send("Error !");
    try {
        const result = await mechanic.updateOne({
            mechanicState: request.body.mechanicState
        });
        response.status(200).send("Done");
    }
    catch (ex) {
        response.status(400).send("error");
    }
}

function validateUpdateMechanic(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(20).regex(/[a-zA-Z]|[ء-ي]/).required()
            .label('First Name')
            .messages({
                'string.base': `{#label} should be a type of 'text'`,
                'string.empty': `Please Enter Your {#label}`,
                'string.min': '{#label} should have a minimum length of {#limit}',
                'string.pattern.base': `{#label} should contain only letters`,
                'any.required': `Please Enter Your {#label}`
            }),
        lastName: Joi.string().min(3).max(20).regex(/[a-zA-Z]|[ء-ي]/).required()
            .label('Last Name')
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
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName', 'governorate']));

}

// Untill I find a Translator Method
function validateArabicUpdateMechanic(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(20).regex(/[ء-ي]/).required()
            .messages({
                'string.empty': `من فضلك ادخل اسمك`,
                'string.min': 'يجب ان يكون اسمك حرفين على الاقل',
                'string.pattern.base': `يجب ان يحتوي اسمك على حروف عربية فقط`,
                'any.required': `من فضلك ادخل اسمك`
            }),
        lastName: Joi.string().min(3).max(20).regex(/[ء-ي]/).required()
            .messages({
                'string.empty': `من فضلك ادخل الاسم الاخير`,
                'string.min': 'يجب ان يكون الاسم الاخير ثلاثة احرف على الاقل',
                'string.pattern.base': `يجب ان يحتوي الاسم الاخير على حروف عربية فقط`,
                'any.required': `من فضلك ادخل الاسم الاخير`
            }),
        governorate: Joi.string().valid('الإسكندرية', 'مطروح', 'الساحل الشمالي', 'البحيرة', 'كفر الشيخ', 'طنطا', 'المنصورة', 'بنها'
            , 'دمياط', 'الشرقية', 'المنوفية', 'الاسماعيلية',
            'بورسعيد', 'السويس', 'السخنة', 'الغردقة', 'شرم الشيخ', 'قنا', 'سوهاج'
            , 'اسيوط', 'اسوان', 'المنيا', 'بني سويف', 'الفيوم',
            'الوادي الجديد', 'راس غارب', 'سفاجا', 'القصير', 'مرسى علم').required()
            .messages({
                'string.empty': `من فضلك ادخل المحافظة`,
                'any.only': 'يجب ان تكون محافظة من تلك القائمة {#valids}',
                'any.required': `من فضلك ادخل المحافظة`
            })

    });
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName', 'governorate']));

}

function validateUpdateMechanicOptionalData(request) {
    // Validation
    const validationSchema = Joi.object({
        employee: Joi.boolean().default(false).required(),
        centerId: Joi.string().when('employee', {
            is: Joi.boolean().valid(true).required(),
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    });
    return validationSchema.validate(_.pick(request.body, ['employee', 'centerId']));

}

function validateUpdateMechanicAfterApproval(request) {
    // Validation
    const validationSchema = Joi.object({
        mechanicState: Joi.string().valid('Offline', 'Idle', 'Busy').required()
    });
    return validationSchema.validate(_.pick(request.body, ['mechanicState']));

}

module.exports = {
    handleMechanicRegisteration: handleMechanicRegisteration,
    handleUpdateData: handleUpdateData,
    handleRestOfImageData: handleRestOfImageData,
    handleRestOfData: handleRestOfData,
    handleRestOfDataAfterApproval: handleRestOfDataAfterApproval
};