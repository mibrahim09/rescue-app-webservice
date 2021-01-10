const configDB = require('../../config');
const Joi = require('joi');

function handleCustomerRegisteration(request, response) {
    var schema = validateUserRequest(request.body);
    const { error, value } = schema.validate(request.body);
    if (error) {
        response
            .status(400)
            .send(error);
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
        phoneNumber: Joi.string().length(11).required()
    });
    return validationSchema;

}

module.exports = {
    handleCustomerRegisteration: handleCustomerRegisteration
};