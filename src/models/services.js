const config = require('config');
const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');

const serviceScheme = mongoose.Schema({
    Category: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 30
    },
    ServiceDesc: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    ExpectedFare: {
        type: Number,
        Default: 0.0,
        requred: true
    }
});

const Services = mongoose.model('admin_services', serviceScheme);


async function createNewService(request, response) {
    const service = new Services({
        Category: request.body.Category,
        ServiceDesc: request.body.ServiceDesc,
        ExpectedFare: request.body.ExpectedFare
    });
    try {
        const myPromise = await service.save();
        response.status(200).send(service);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

function validateService(request) {
    // Validation
    const validationSchema = Joi.object({
        Category: Joi.string().max(30).min(2).required(),
        ServiceDesc: Joi.string().max(100).min(2).required(),
        ExpectedFare: Joi.number()
    });
    return validationSchema.validate(request.body);

}

module.exports = {
    Services: Services,
    createNewService: createNewService,
    validateService: validateService
};