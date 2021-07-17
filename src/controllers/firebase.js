var admin = require('firebase-admin');
var serviceAccount = require("../config/firebase_config.json");
const config = require('config');
const debug = require('debug')('app:firebase');
function Init() {

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //credential: admin.credential.applicationDefault(),
        databaseURL: config.get('firebaseDatabase')
    });
    debug(`Firebase initialized on ${admin.databaseURL}!`);
}

const validateCustomerPhonePromise = request => new Promise(resolve => {
    console.log(config.get('firebaseDatabase'));
    admin
        .auth()
        .getUser(request.body.fireBaseId)
        .then((userRecord) => {
            // // response.status(200).send(userRecord);
            // // See the UserRecord reference doc for the contents of userRecord.
            // console.log(`Phone: ${userRecord.phoneNumber}`);
            // console.log(`Last login time: ${userRecord.metadata.lastSignInTime}`);
            if (userRecord.phoneNumber != request.body.phoneNumber)
                return resolve("Phone number didnt match the firebaseId");

            /** and lastSignIntime provided didnt pass 1 hour */
            return resolve("OK");


        })
        .catch((error) => {
            console.log(error);
            return resolve("Invalid UserIdToken.");
        });

});
async function validateCustomerPhone(request) {
    return await validateCustomerPhonePromise(request);
}

module.exports = {
    validateCustomerPhone: validateCustomerPhone,
    Init: Init
}