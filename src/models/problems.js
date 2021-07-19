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
    Problem: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    Subproblem: {
        type: String,
        minlength: 2,
        maxlength: 100
    },
    ExpectedFare: {
        type: Number,
        Default: 0.0
    },
    AtHome:{
        type: Boolean,
        Default: true
    },
    AtRescue:{
        type: Boolean,
        Default: true
    }
});

const Problem = mongoose.model('admin_problems', serviceScheme);


async function createNewProblem(request, response) {
    const problem = new Problem({
        Category: request.body.Category,
        Problem: request.body.Problem,
        Subproblem: request.body.Subproblem,
        ExpectedFare: request.body.ExpectedFare,
        AtHome: request.body.AtHome,
        AtRescue: request.body.AtRescue
    });
    try {
        const myPromise = await problem.save();
        response.status(200).send(problem);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

function validateProblem(request) {
    // Validation
    const validationSchema = Joi.object({
        Category: Joi.string().max(30).min(2).required(),
        Problem: Joi.string().max(100).min(2).required(),
        Subproblem: Joi.string().max(100).min(2),
        ExpectedFare: Joi.number(),
        AtHome: Joi.boolean(),
        AtRescue: Joi.boolean()
    });
    return validationSchema.validate(request.body);

}

module.exports = {
    Problem: Problem,
    createNewProblem: createNewProblem,
    validateProblem: validateProblem
};