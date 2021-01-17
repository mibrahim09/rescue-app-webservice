const router = require("express").Router();
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const jwt = require('jsonwebtoken');
const config = require('config');
const { Customer } = require('../models/customer');

router.post('/trial', async (request, response) => {

    const { error, value } = validatePhone(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    let user = await Customer.findOne({ phoneNumber: request.body.phoneNumber });
    if (!user) return response.status(200).send('Invalid Number!'); 

    const token = jwt.sign({_id: user._id, firstName: user.firstName},config.get('jwtPrivateKey'));
    response.send(token);
});

function validatePhone(request) {
    // Validation
    const validationSchema = Joi.object({
        phoneNumber: Joi.string().length(11).regex(/^(01)[0-9]{9}$/).required()
    });
    return validationSchema.validate(request.body);

}

module.exports = router;