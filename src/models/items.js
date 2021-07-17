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
    ItemDesc: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    Price: {
        type: Number,
        required: true,
        Default: 0.0
    }
});

const Item = mongoose.model('admin_items', serviceScheme);


async function createNewItem(request, response) {
    const item = new Item({
        Category: request.body.Category,
        ItemDesc: request.body.ItemDesc,
        Price: request.body.Price
    });
    try {
        const myPromise = await item.save();
        response.status(200).send(item);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }
}

function validateServiceItem(request) {
    // Validation
    const validationSchema = Joi.object({
        Category: Joi.string().max(30).min(2).required(),
        ItemDesc: Joi.string().max(100).min(2).required(),
        Price: Joi.number()
    });
    return validationSchema.validate(request.body);

}

module.exports = {
    Item: Item,
    createNewItem: createNewItem,
    validateServiceItem: validateServiceItem
};