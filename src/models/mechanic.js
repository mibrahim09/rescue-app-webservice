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
    TotalStars: {
        type: Number,
        default: 0
    },
    TotalRides: {
        type: Number,
        default: 0
    },
    governorate: {
        type: String,
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
    },
    employee: {
        type: Boolean,
        default: false
    },
    centerId: {
        type: mongoose.SchemaTypes.ObjectId,
        required: function () { return this.employee; }
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
        phoneNumber: Joi.string().length(13).regex(/(\+)(201)[0-9]{9}/).required(),
        fireBaseId: Joi.string().required()
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

async function insertStars(mechanicId, Stars, response) {

    let user = await Mechanic.findOne({ _id: mechanicId });

    if (!user) return response.status(400).send({
        "error": "User doesn't exist."
    });
    try {

        let result = await Mechanic.findOneAndUpdate(
            { _id: mechanicId },// filter
            { // updated data
                TotalStars: user.TotalStars + Stars,
                TotalRides: user.TotalRides + 1
            },
            {
                new: true
            });

    }
    catch (ex) {
        return response.status(400).send({ "error": ex.message });
    }

}

module.exports = {
    Mechanic: Mechanic,
    inserMechanicStars: insertStars,
    createMechanicUser: createMechanicUser,
    validatePhone: validatePhone
};