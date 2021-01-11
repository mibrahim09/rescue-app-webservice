const configDB = require('../../config');
const Joi = require('joi');

function handleWinchDriverRegisteration(request, response) {
    var schema = validateUserRequest(request.body);
    const { error, value } = schema.validate(request.body);
    if (error) {
        response
            .status(400)
            .send(error.details[0].message);
        return;
    }
    
    // VALID USER.
    // TODO: SEND VERIFICATION NUMBER AND ACCESSTOKEN.

    response.send({
        message: 'valid data'
    });


}
function validateUserRequest(request) {
    // Validation
    const validationSchema = Joi.object({
        firstName: Joi.string().min(2).max(10).required(),
        lastName: Joi.string().min(2).max(10).required(),
        phoneNumber: Joi.string().length(11).regex(/^(01)[0-9]{9}$/).required(),
        personalPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        
        //personalPicture: Joi.binary().encoding('base64').max(5*1024*1024), // 5 MB

        //driverLicensePicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchLicenseFrontPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchLicenseRearPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //driverCriminalRecordPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //driverDrugAnalysisPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        //winchCheckReportPicture: Joi.string().regex(/\.(jpg|jpeg|png)$/i).required(),
        winchPlates: Joi.string().alphanum().min(4).max(7).required()   
    });
    return validationSchema;

}

module.exports = {
    handleWinchDriverRegisteration: handleWinchDriverRegisteration
};