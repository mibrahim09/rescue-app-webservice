const firebase = require('../controllers/firebase');
const configDB = require('../config');
const Joi = require('joi');
const _ = require('lodash');
const { Driver, createWinchUser, validatePhone } = require('../models/winchDriver');
const { request } = require('express');

//const translate = require('translatte');

async function handleWinchDriverRegisteration(request, response) {

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

    let driver = await Driver.findOne({ phoneNumber: request.body.phoneNumber });
    if (driver) {
        verified = false;
        if (driver.firstName && driver.lastName && driver.winchPlates &&
            driver.personalPicture && driver.driverLicensePicture && driver.winchLicenseFrontPicture && driver.winchLicenseRearPicture &&
            driver.driverCriminalRecordPicture && driver.driverDrugAnalysisPicture && driver.winchCheckReportPicture)
            verified = true;
        var result = await driver.generateFinalAuthToken(verified);
        if (verified)
            // USER ALREADY EXISTS and has a first or last name. Send them
            return response.status(200).send({ "token": result, "firstName": driver.firstName, "lastName": driver.lastName, "winchPlates": driver.winchPlates, "governorate": driver.governorate });
        else
            // USER ALREADY EXISTS. ==> but no first or last name.
            return response.status(200).send({ "token": result });
    }

    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.
    await createWinchUser(request, response);

}

async function handleUpdateData(request, response) {

    const language = request.header('language');

    if (language == 'en') {
        const { error, value } = validateUpdateDriver(request);
        if (error) return response.status(400).send({ "error": error.details[0].message })
    };

    if (language == 'ar') {
        const { error, value } = validateArabicUpdateDriver(request);
        if (error) return response.status(400).send({ "خطأ": error.details[0].message })
    };

    let driver = await Driver.findOne({ _id: request.driver._id }); //_id: request.params.id
    if (!driver) return response.status(400).send({
        "error": "User doesn't exist."
    });

    try {
        const result = await Driver.findByIdAndUpdate(
            { _id: request.driver._id },// filter
            {
                $set: {
                    isMobileVerified: true,
                    firstName: request.body.firstName,
                    lastName: request.body.lastName,
                    winchPlates: request.body.winchPlates,
                    governorate: request.body.governorate
                    //locationsCovered: request.body.locationsCovered

                    //Postman
                    //"locationsCovered": ["Alexandria Desert Road", "Alexandria Agriculture Road"]
                }
            },
            {
                new: true
            });

        const newToken = await result.generateAuthToken(false);// NEW TOKEN with the rest of data set.
        response.status(200).send({ "token": newToken });
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

        const newToken = await result.generateFinalAuthToken(true);// NEW TOKEN with the rest of data set.
        response.status(200).send({ "token": newToken });
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
        winchPlates: Joi.string().min(4).max(7).regex(/([0-9][ء-ي])|([ء-ي][0-9])/).example('111سسس').required()
            .label('Winch Plates')
            .messages({
                'string.base': `{#label} should be a type of 'text'`,
                'string.empty': `Please Enter Your {#label}`,
                'string.min': '{#label} should have a minimum length of {#limit}',
                'string.pattern.base': `{#label} should contain letters and numbers`,
                'any.required': `Please Enter Your {#label}`
            }),
        governorate: Joi.string().valid('Ain Sokhna', 'Alexandria', 'Aswan', 'Asyut', 'Banha', 'Beheira', 'Beni Suef', 'Cairo',
            'Dakahlia', 'Damietta', 'Faiyum', 'Gharbia', 'Giza', 'Hurghada', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Mansoura',
            'Marsa Alam', 'Matruh', 'Minya', 'Monufia', 'New Valley', "North Coast", 'North Sinai', 'Port Said', 'Qalyubia', 'Qena',
            'Quseer', 'Ras Ghareb', 'Red Sea', 'Safaga', 'Sharm El-Sheikh', 'Sharqia', 'Sohag', 'South Sinai', 'Suez', 'Tanta').required()

        //, 'locationsCovered'
        /*locationsCovered: Joi.string().when('governorate', {
            switch: [
                { is: 'Alexandria', then: Joi.valid("Alexandria Desert Road", "Alexandria Agriculture Road") },
            ],
            otherwise: Joi.valid(null)
        })*/
        //Postman
        //"locationsCovered": "Alexandria Desert Road"
    });
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName', 'winchPlates', 'governorate']));

}

// Untill I find a Translator Method
function validateArabicUpdateDriver(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(20).regex(/[a-zA-Z]|[ء-ي]/).required()
            .messages({
                'string.empty': `من فضلك ادخل اسمك`,
                'string.min': 'يجب ان يكون اسمك حرفين على الاقل',
                'string.pattern.base': `يجب ان يحتوي اسمك على حروف عربية فقط`,
                'any.required': `من فضلك ادخل اسمك`
            }),
        lastName: Joi.string().min(3).max(20).regex(/[a-zA-Z]|[ء-ي]/).required()
            .messages({
                'string.empty': `من فضلك ادخل الاسم الاخير`,
                'string.min': 'يجب ان يكون الاسم الاخير ثلاثة احرف على الاقل',
                'string.pattern.base': `يجب ان يحتوي الاسم الاخير على حروف عربية فقط`,
                'any.required': `من فضلك ادخل الاسم الاخير`
            }),
        winchPlates: Joi.string().min(4).max(7).regex(/([0-9][ء-ي])|([ء-ي][0-9])/).example('111سسس').required()
            .messages({
                'string.empty': `من فضلك ادخل لوحة السيارة`,
                'string.min': 'يجب ان تحتوي لوحة السيارة على حروف و ارقام',
                'string.pattern.base': 'يجب ان تحتوي لوحة السيارة على حروف و ارقام',
                'any.required': `من فضلك ادخل لوحة السيارة`
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
    return validationSchema.validate(_.pick(request.body, ['firstName', 'lastName', 'winchPlates', 'governorate']));

}


function validateUpdateDriverAfterApproval(request) {
    // Validation
    const validationSchema = Joi.object({
        winchState: Joi.string().valid('Offline', 'Idle', 'Busy').required()
    });
    return validationSchema.validate(_.pick(request.body, ['winchState']));

}

module.exports = {
    handleWinchDriverRegisteration: handleWinchDriverRegisteration,
    handleUpdateData: handleUpdateData,
    handleRestOfImageData: handleRestOfImageData,
    handleRestOfDataAfterApproval: handleRestOfDataAfterApproval
};