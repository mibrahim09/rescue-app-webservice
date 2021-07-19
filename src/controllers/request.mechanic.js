const Joi = require('joi');
const { MechanicRequest } = require('../models/MechanicRequest');
const { Mechanic, inserMechanicStars, createMechanicUser, validatePhone } = require('../models/mechanic');
const { Customer, insertCustomerStars } = require('../models/customer');
const { Cars, createCar, validateCar } = require('../models/cars');
const { Services, createNewService, validateService } = require('../models/services');
const { Problem, createNewProblem, validateProblem } = require('../models/problems');
const { Item, createNewItem, validateItem } = require('../models/items');
const { CentersCars } = require('../models/centersCars');

//const { winstonLogger } = require('../controllers/request.winch');
var m = require('meters')
var mongoose = require('mongoose');
const { inRange } = require('lodash');

const winston = require('winston');
const cars = require('../models/cars');
const customer = require('../models/customer');
const mechanic = require('../models/mechanic');
require('winston-mongodb');
//winston.add(winston.transports.MongoDB, { db: 'mongodb2://localhost/winchdb' });

var ReadyToAcceptRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var AcceptedRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var ActiveCustomerRides = new Map();// DICTIONARY --> KEY: OwnerId, VAL: RequestId

var ActiveMechanicRides = new Map();// DICTIONARY --> KEY: MechanicId, VAL: RequestId
var DistancesMap = new Map();
var MatchedMechanics = new Map();

var ReadyToRequestMechanics = []; // KEY: mechanicId
var mechanicLocation = {}; // requestId: mechanicId: Locaton

const RIDE_STATUS_SEARCHING = 'SEARCHING';
const RIDE_STATUS_ACCEPTED = 'ACCEPTED';
const RIDE_STATUS_CWAITING = 'WAITING_FOR_APPROVAL';
const RIDE_STATUS_WAITING = 'CUSTOMER_RESPONSE';
const RIDE_STATUS_STARTED = 'Service STARTED';
const RIDE_STATUS_COMPLETED = 'COMPLETED';
const RIDE_STATUS_UNKNOWN = 'UNKNOWN';
const RIDE_STATUS_TERMINATED = 'TERMINATED';
const RIDE_STATUS_ARRIVED = 'ARRIVED';


var googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyAK0cIYx9Ph4ld0CzcG4LRFAWcNeXFAXT8"
});

// NOT COMPLETED YET
async function getAllAvailableCars(request, response) {
    let mechanic = await Mechanic.findOne({ _id: request.mechanic._id });
    if (!mechanic) return response.status(400).send({ "error": "User doesn't exist." });
    try {
        let result = await CentersCars.find(
            {
                CenterId: mongoose.Types.ObjectId(mechanic.centerId),
                Unavailable: false
            },
            function (err, docs) {
                console.log(docs);
            });
        response.status(200).send(result);
    }
    catch (ex) {
        response.status(400).send({ "error": ex.message });
    }

}

function validateNewRequest(request) {
    const validationSchema = Joi.object({
        PickupLocation_Lat: Joi.string().required(),
        PickupLocation_Long: Joi.string().required(),
        IntialDiagnosis: Joi.array().items(Joi.object(
            {
                id: Joi.string().required(),
                category: Joi.string().valid("problem", "service").required()
            })).required(),
        Estimated_Time: Joi.string().required(),
        Estimated_Fare: Joi.string().required(),
        Car_ID: Joi.string().required()
    });
    return validationSchema.validate(request.body);
}

function validateEndRide(request) {
    const validationSchema = Joi.object({
        finalLocation_Lat: Joi.string().required(),
        finalLocation_Long: Joi.string().required()
    });
    return validationSchema.validate(request.body);
}

function validateRating(request) {
    const validationSchema = Joi.object({
        Stars: Joi.number().max(5).min(1).required()
    });
    return validationSchema.validate(request.body);
}

function validateMechanicRequest(request) {
    const validationSchema = Joi.object({
        Location_Lat: Joi.string().required(),
        Location_Long: Joi.string().required()
    });
    return validationSchema.validate(request.body);
}

function validateMechanicResponse(request) {
    const validationSchema = Joi.object({
        mechanicResponse: Joi.string().valid("Accept", "Deny", "Arrived", "Service Start").required()
    });
    return validationSchema.validate(request.body);
}

function validateCustomerResponse(request) {
    const validationSchema = Joi.object({
        customerResponse: Joi.string().valid("Approve", "Refuse").required()
    });
    return validationSchema.validate(request.body);
}


function getDirections(req, callback) {
    googleMapsClient.distanceMatrix({
        origins: req.origin,
        destinations: req.destination,
        mode: req.mode,
        units: 'metric'

    }, function (err, response) {
        console.log(err);
        if (!err) {
            callback(response);
        };
    });

};

function getVisitFare(ride) {
    var visitFare = 0.0;
    googleMapsClient.distanceMatrix({
        origins: ride.initial_LocationLat + ',' + ride.initial_LocationLong,
        destinations: ride.pickupLocation,
        mode: 'driving'

    }, function (err, response) {
        if (!err) {
            let distance = response.json.rows[0].elements[0].distance.text;
            let duration = response.json.rows[0].elements[0].duration.text;
            console.log(distance);
            dist = distance.substr(0, distance.indexOf(" km"));
            visitFare += (parseFloat(dist).toFixed(2)) * 2.85;

            time = duration.substr(0, duration.indexOf(" min"));
            ride.Expected_duration = parseFloat(time);
            visitFare += (parseFloat(time)) * 0.42;
            console.log(visitFare);
            ride.set_visit_fare(visitFare);

        };
    });
};

function getRideStatus(requestId) {
    if (ReadyToAcceptRides.has(requestId))
        return RIDE_STATUS_SEARCHING;
    if (AcceptedRides.has(requestId))
        return RIDE_STATUS_ACCEPTED;
    return RIDE_STATUS_UNKNOWN;
}

function getMilliSeconds(minutes) {
    return minutes * 60 * 1000;
}

function getRide(requestId) {
    var ride = ReadyToAcceptRides.get(requestId);
    if (ride == null) {
        ride = AcceptedRides.get(requestId);
    }
    return ride;

}


async function handleCustomer2MechanicRating(request, response) {

    // Validate the input must have the finish location.
    const { error, value } = validateRating(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const customerId = request.user._id;

    // Get the Request Id from ActiveCustomerRides
    var currentRequestId = ActiveCustomerRides.get(customerId);
    if (currentRequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }


    // Get the Ride Object
    var ride = getRide(currentRequestId);
    if (ride.Status == RIDE_STATUS_COMPLETED) {

        if (ride.WAITING_FOR_CUSTOMER_RATING) {
            ride.WAITING_FOR_CUSTOMER_RATING = false;
            console.log(ride);
            await inserMechanicStars(ride.mechanicId, request.body.Stars, response);// Inserting the stars inside the customerDb.

            ActiveCustomerRides.delete(customerId);//Remove the customerId from ActiveCustomerRides

            if (!ride.WAITING_FOR_MECHANIC_RATING && !ride.WAITING_FOR_CUSTOMER_RATING)
                AcceptedRides.delete(currentRequestId);

            return response.status(200).send({
                "msg": "Rated Successfully"
            });

        }
        else {
            return response.status(400).send({
                "error": "You have already rated!"
            });
        }

    }
    else {
        return response.status(400).send({
            "error": "You cant rate this ride unless it ends.",
            "status": ride.Status
        });
    }

}


async function handleMechanic2CustomerRating(request, response) {

    // Validate the input must have the finish location.
    const { error, value } = validateRating(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const mechanicId = request.mechanic._id;


    // Get the Request Id from ActiveMechanicRides
    var currentRequestId = ActiveMechanicRides.get(mechanicId);
    if (currentRequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get the Ride Object
    var ride = getRide(currentRequestId);
    if (ride.Status == RIDE_STATUS_COMPLETED) {

        if (ride.WAITING_FOR_MECHANIC_RATING) {
            ride.WAITING_FOR_MECHANIC_RATING = false;

            await insertCustomerStars(ride.requesterId, request.body.Stars, response);// Inserting the stars inside the customerDb.

            ActiveMechanicRides.delete(mechanicId);//Remove the DriverId from ActiveDriverRides

            if (!ride.WAITING_FOR_MECHANIC_RATING && !ride.WAITING_FOR_CUSTOMER_RATING)
                AcceptedRides.delete(currentRequestId);

            return response.status(200).send({
                "msg": "Rated Successfully"
            });

        }
        else {
            return response.status(400).send({
                "error": "You have already rated!"
            });
        }

    }
    else {
        return response.status(400).send({
            "error": "You cant rate this ride unless it ends.",
            "status": ride.Status
        });
    }

}

function AddLogsToDb(ridee) {
    winston.log('info', ridee);
}


async function handleEndRide(request, response) {

    // // Validate the input must have the finish location.
    // const { error, value } = validateEndRide(request);
    // if (error) return response
    //     .status(400)
    //     .send({ "error": error.details[0].message });


    const mechanicId = request.mechanic._id;

    // Get the Request Id from ActiveDriverRides
    var currentRequestId = ActiveMechanicRides.get(mechanicId);
    if (currentRequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get the Ride Object
    var ride = getRide(currentRequestId);
    if (ride != null) {
        if ((ride.Status == RIDE_STATUS_STARTED) || ((ride.Status == RIDE_STATUS_WAITING) && (ride.customerApproval == false)) ) {
            ride.setStatus(RIDE_STATUS_COMPLETED);// Change status to completed
            // Set the values for the finish
            ride.FinishTimeStamp = Date.now();
            ride.WAITING_FOR_MECHANIC_RATING = ride.WAITING_FOR_CUSTOMER_RATING = true;
            // Get the fare
            ride.CalcuateFare();
            let customer = await Customer.findOne({ _id: ride.requesterId });
            if ( customer.wallet != 0 ){
                ride.Fare += customer.wallet * -1;
                console.log(ride.Fare.toFixed(2));
                let customerResult = await Customer.findOneAndUpdate(
                    { _id: ride.requesterId },
                    { // updated data
                        wallet: 0
                    },
                    {
                        new: true
                    });
            }
            // Save the Ride to Logs.
            AddLogsToDb(ride);
            return response.status(200).send(
                {
                    "STATUS": ride.Status,
                    "Fare": ride.Fare,
                    "TotalTimeForService": ride.getFinishETA()
                });
        }
        else return response.status(400).send({
            "error": "You can only end a started ride.",
            "status": ride.Status,
            "customerResponse": ride.customerApproval
        });

    }
    else {
        return response.status(400).send({
            "error": "There is no active ride"
        });
    }

}


async function handleCustomerNewRequest(request, response) {
    // Validate the Input
    const { error, value } = validateNewRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    var customerIntialDiagnosis = [];

    // Get the dropoff and pickup location (latitude, longitude)
    const pickUpLocation = { lat: request.body.PickupLocation_Lat, lng: request.body.PickupLocation_Long };
    //const IntialDiagnosis = request.body.IntialDiagnosis;
    for (const diagnosis of request.body.IntialDiagnosis) {
        if (diagnosis.category == "problem") {
            let problem = await Problem.findOne({ _id: diagnosis.id })
            if (!problem) {
                response.status(400).send({ "error": "Problem doesn't exist" });
            }
            else {
                problemObject = {
                    RequestCategory: diagnosis.category,
                    ProblemCategory: problem.Category,
                    Problem: problem.Problem,
                    SubProblem: problem.Subproblem
                }
                customerIntialDiagnosis.push(problemObject);
            }
        }
        else if (diagnosis.category == "service") {
            let service = await Services.findOne({ _id: diagnosis.id })
            if (!service) {
                response.status(400).send({ "error": "service doesn't exist" });
            }
            else {
                serviceObject = {
                    RequestCategory: diagnosis.category,
                    ServiceCategory: service.Category,
                    ServiceDesc: service.ServiceDesc,
                    ServiceFare: service.ExpectedFare
                }
                customerIntialDiagnosis.push(serviceObject); 
            }
                
        }
    }
    const est_time = request.body.Estimated_Time;
    const est_fare = request.body.Estimated_Fare;
    const carID = request.body.Car_ID;

    let customerCar = await Cars.findOne({ _id: carID })
    if (!customerCar) return response.status(400).send({ "error": "No such car found." });
    if (customerCar.OwnerId != request.user._id) return response.status(400).send({ "error": "This car isn't owned by this user." });
    
    const customerId = request.user._id;
    // Check if this customer has an active request?
    // ActiveCustomerRides ==> Contains if the customer has an active ride. So he cant order 2 rides at the same time. 
    // Map<key: CustomerId, Value: RequestId>
    var currentRequestId = ActiveCustomerRides.get(customerId);
    if (currentRequestId != null) {
        //var currentRequestId = ActiveCustomerRides.get(customerId);
        var ride = getRide(currentRequestId);
        if (ride.Status == RIDE_STATUS_COMPLETED)
            return response.status(400).send({
                "error": "You need to rate the previous ride before moving to another.",
                "status": ride.Status,
                "requestId": currentRequestId
            });
        else
            return response.status(400).send({
                "error": "This customer has already an active ride.",
                "status": ride.Status,
                "requestId": currentRequestId
            });
    }

    // Customer doesnt have any active rides.
    // Generate Unique Request Id
    const requestId = mongoose.Types.ObjectId();
    // Add it to the ActiveCustomerRides
    ActiveCustomerRides.set(customerId, requestId);

    // Generate New Request Object Constructor: CutomerId, Pickuplocation, DropOffLocation
    let newRequest = new MechanicRequest(customerId, pickUpLocation, est_time, est_fare, customerCar);
    newRequest.RequestId = requestId.toString();

    newRequest.setStatus(RIDE_STATUS_SEARCHING);
    // Map <key: RequestId, Value: RequestObject>
    ReadyToAcceptRides.set(requestId, newRequest);

    for (var i = 0; i < customerIntialDiagnosis.length; i++) {
        newRequest.customerIntialDiagnosis.push(customerIntialDiagnosis[i]);
    }
    console.log(newRequest.customerIntialDiagnosis);

    // Response sent to the server (Status, RequestId)
    response.status(200).send({ "status": newRequest.Status, "requestId": requestId });// So the app can send a request asking about it every 30 seconds.
}

function acceptRide(requestId, mechanicId) {
    var ride = null;
    ride = ReadyToAcceptRides.get(requestId);
    ride.setStatus(RIDE_STATUS_ACCEPTED);
    ride.mechanicId = mechanicId;
    ride.acceptedStamp = Date.now();
    customerId = ride.requesterId;
    ReadyToAcceptRides.delete(requestId);
    AcceptedRides.set(requestId, ride);         // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
    ActiveMechanicRides.set(mechanicId, requestId); // DICTIONARY --> KEY: mechanicId, VAL: RequestId     
    return customerId;
}

async function dummyStart(request, response) {
    var ride = null;
    var requestId = ActiveMechanicRides.get(request.driver._id);
    ride = AcceptedRides.get(requestId);
    ride.StartedTimeStamp = Date.now();
    ride.setStatus(RIDE_STATUS_STARTED);
    return response.send({
        "status": ride.Status
    })
}


function terminateRide(requestId, customerId) {
    var status = getRideStatus(requestId);
    if (status == RIDE_STATUS_SEARCHING) {
        ReadyToAcceptRides.delete(requestId);
        ActiveCustomerRides.delete(customerId);
    }
}

async function handleMechanicRequest(request, response) {

    const { error, value } = validateMechanicRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const MechanicLocation = { lat: request.body.Location_Lat, lng: request.body.Location_Long };

    Mechanicid = request.mechanic._id

    var currentRequestId = ActiveMechanicRides.get(Mechanicid);
    if (currentRequestId != null) {
        var ride = getRide(currentRequestId);
        if (ride.Status == RIDE_STATUS_COMPLETED)
            return response.status(400).send({
                "error": "You need to rate the previous ride before moving to another.",
                "status": ride.Status,
                "requestId": currentRequestId
            });
        else
            return response.status(400).send({
                "error": "You already have an active ride.",
                "status": ride.Status,
                "requestId": currentRequestId
            });
    }

    if (!ReadyToRequestMechanics.includes(Mechanicid)) {
        ReadyToRequestMechanics.push(Mechanicid);
    }
    console.log(ReadyToRequestMechanics);

    if (ReadyToAcceptRides.size == 0) {
        return response.status(400).send({ "error": "No client requests now" });
    }
    const promise = rideinturn => new Promise((resolve) => {

        getDirections(inputs, function (result) {

            try {
                Distance = result.json.rows[0].elements[0].distance.text,
                    Duration = result.json.rows[0].elements[0].duration.text
                if (m(Distance) <= rideinturn[1].searchScope) {
                    DistancesMap.set(rideinturn[0], Distance)
                }
                //DistancesMap.set(rideinturn[0], Distance)
                resolve(Distance)
            }
            catch (ex) { console.log(ex); }

        });
    });
    RideInTurn = []
    var inputs

    for (let RideInTurn of ReadyToAcceptRides.entries()) {
        if ((Date.now() - RideInTurn[1].creationTimeStamp) < getMilliSeconds(10) && !(RideInTurn[1].listofMechanicsRejected.includes(Mechanicid))) {
            inputs = {
                origin: [RideInTurn[1].pickupLocation],
                destination: [MechanicLocation]
            };
            await promise(RideInTurn)
        }

        var mechanicIdIndex = RideInTurn[1].listofMechanicsRejected.indexOf(Mechanicid);
        RideInTurn[1].listofMechanicsRejected.splice(mechanicIdIndex, 1);
    }

    if (DistancesMap.size == 0) {
        return response.status(400).send({ "error": "No client requests now" });
    }
    else {

        NearestRide = DistancesMap.entries().next().value
        for (let dist of DistancesMap.entries()) {
            if (m(dist[1]) < m(NearestRide[1])) {
                NearestRide = dist
            }
        }

        var mechanicInfo = {
            id: Mechanicid,
            lat: request.body.Location_Lat,
            lng: request.body.Location_Long

        }

        mechrequest = ReadyToAcceptRides.get(NearestRide[0]);
        DistancesMap.clear();
        var index = ReadyToRequestMechanics.indexOf(Mechanicid);
        ReadyToRequestMechanics.splice(index, 1);
        console.log(ReadyToRequestMechanics);

        MatchedMechanics.set(Mechanicid, NearestRide[0]);
        
        mechanicLocation[NearestRide[0]] = mechanicInfo;
        console.log(Object.entries(mechanicLocation));
        

        return response.status(200).send({
            "Nearest Ride: Pickup Location": mechrequest.pickupLocation,
            "Initial Diagnosis": mechrequest.customerIntialDiagnosis,
            "CarBrand": mechrequest.customerCarBrand,
            "CarModel": mechrequest.customerCarModel,
            "CarYear": mechrequest.customerCarYear,
            "CarPlates": mechrequest.customerCarPlates
        });

    }

}

async function handleUpdateMechanicLocation(request, response) {
    const { error, value } = validateMechanicRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const lat = request.body.Location_Lat;
    const long = request.body.Location_Long;

    let mechanicId = request.mechanic._id;

    var currentRequestId = ActiveMechanicRides.get(mechanicId);
    if (currentRequestId == null)
        return response.status(400).send({ "error": "You don't have an active ride." });

    var ride = getRide(currentRequestId);
    if (ride != null) {
        ride.updateMechanicLocation(lat, long);
        return response.status(200).send({ "Done": "Your Location has been Updated Successfully" });
    }
}


async function handleMechanicResponse(request, response) {

    const { error, value } = validateMechanicResponse(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    MechanicId = request.mechanic._id;
    const MechanicResponse = request.body.mechanicResponse;

    if (MechanicResponse == "Accept") {
        RequestID = MatchedMechanics.get(MechanicId);
        if (RequestID == null) {
            return response.status(400).send({ "Error": "You Have No Matched Ride!" });
        }
        if (!ReadyToAcceptRides.has(RequestID)) {
            return response.status(400).send({ "Error": "Sorry Ride Is Canceled." });
        }
        const customerId = acceptRide(RequestID, MechanicId);
        ride = AcceptedRides.get(RequestID);
        if (mechanicLocation.hasOwnProperty(RequestID)) {
            if(mechanicLocation[RequestID].id == MechanicId){
                ride.setMechanicInitialLocation(mechanicLocation[RequestID].lat, mechanicLocation[RequestID].lng);
            }
        }
        let customerCar = ride.customerCar;
        let customer = await Customer.findOne({ _id: customerId });
        MatchedMechanics.delete(MechanicId)
        return response.status(200).send({
            "firstName": customer.firstName,
            "lastName": customer.lastName,
            "phoneNumber": customer.phoneNumber,
            "EstimatedTime": ride.estimated_time,
            "EstimatedFare": ride.estimated_fare

        });
    }

    else if (MechanicResponse == "Deny") {
        RequestID = MatchedMechanics.get(MechanicId);
        if (RequestID == null) {
            return response.status(400).send({ "Error": "You Have No Matched Ride!" });
        }
        ride = ReadyToAcceptRides.get(RequestID);
        if (!ride.listofMechanicsRejected.includes(Mechanicid)) {
            ride.listofMechanicsRejected.push(Mechanicid);
        }
        console.log(ride.listofMechanicsRejected);
        MatchedMechanics.delete(MechanicId)
        return response.status(200).send({ "msg": "Check For Another Request" });
    }

    else if (MechanicResponse == "Arrived") {
        RequestID = ActiveMechanicRides.get(MechanicId);
        if (RequestID == null) {
            return response.status(400).send({ "Error": "You Have No Client Request!" });
        }
        delete mechanicLocation[RequestID];
        console.log(Object.entries(mechanicLocation));
        AcceptedRide = AcceptedRides.get(RequestID)
        //This part is for later to check whther the driver's arrival location is equal/close to the client's pickup location or not
        // ArrivalLocation = { lat: AcceptedRide.locationLat, lng: AcceptedRide.locationLong };
        //arrivalscope = 200 
        // Inputs = {
        //     origin: [ArrivalLocation],
        //     destination:[AcceptedRide.pickupLocation]
        // }

        // getDirections(Inputs, function (result) {
        //     try {
        //         distance = result.json.rows[0].elements[0].distance.text
        //         console.log(distance)
        //         if (m(distance) > arrivalscope) {
        //             return response.status(200).send({
        //                 "msg": "You haven't arrived yet!"
        //             });
        //         }
        //         else {
        //             AcceptedRide.Status = RIDE_STATUS_ARRIVED;
        //             AcceptedRide.ArrivalTimeStamp = Date.now();
        //             return response.status(200).send({
        //                 "msg": "Alright!"
        //             });
        //         }
        //     }
        //     catch (ex) { console.log(ex); }
        // });
        getVisitFare(AcceptedRide);
        AcceptedRide.Status = RIDE_STATUS_ARRIVED;
        AcceptedRide.ArrivalTimeStamp = Date.now();
        return response.status(200).send({
            "msg": "Alright!"
        });

    }

    else if (MechanicResponse == "Service Start") {
        RequestID = ActiveMechanicRides.get(MechanicId);
        if (RequestID == null) {
            return response.status(400).send({ "Error": "You Have No Client Request!" });
        }
        AcceptedRide = AcceptedRides.get(RequestID)
        if (AcceptedRide.customerApproval == false) {
            return response.status(400).send({ "Error": "You Can't Start Your Service!" });
        }
        if (AcceptedRide.Status != RIDE_STATUS_WAITING) {
            return response.status(400).send({ "Error": "Wait For Customer Response!" });
        }
        if (ride.listofMechanicsRejected.length != 0) {
            ride.listofMechanicsRejected = [];
        }
        //ride.listofMechanicsRejected.splice(0,ride.listofMechanicsRejected.length)
        console.log(ride.listofMechanicsRejected);
        AcceptedRide.setStatus(RIDE_STATUS_STARTED);
        AcceptedRide.StartTimeStamp = Date.now();
        return response.status(200).send({
            "msg": "Alright!"
        });
    }
}

async function handleMechanicCancellation(request, response) {
    // Get mechanicId from JWT Token
    const mechanicId = request.mechanic._id;
    // If the mechanic is still searching for a request
    if (ReadyToRequestMechanics.includes(mechanicId)) {
        var index = ReadyToRequestMechanics.indexOf(mechanicId);
        ReadyToRequestMechanics.splice(index, 1);
        console.log(ReadyToRequestMechanics);
        return response.status(200).send({ "Status": 'CANCELLED' });
    }
    else if (MatchedMechanics.has(mechanicId)) {
        MatchedMechanics.delete(mechanicId);
        return response.status(200).send({ "Status": 'CANCELLED' });
    }
    // If the mechanic has already accepted the request
    else if (ActiveMechanicRides.has(mechanicId)) {
        const requestId = ActiveMechanicRides.get(mechanicId);
        var ride = getRide(requestId);
        if (ride.Status == RIDE_STATUS_ACCEPTED){
            if ((Date.now() - ride.acceptedStamp) > getMilliSeconds(10)) {
                return response.status(400).send({ "error": "You Can't Cancel This Request." });
            }
            AcceptedRides.delete(requestId);
            ActiveMechanicRides.delete(mechanicId);
            if (!ride.listofMechanicsRejected.includes(mechanicId)) {
                ride.listofMechanicsRejected.push(mechanicId);
            }
            console.log(ride.listofMechanicsRejected);
            return response.status(200).send({ "Status": 'CANCELLED', "Details": 'Request was accepted' });
        }
        else if (ride.Status == RIDE_STATUS_ARRIVED){
            if ((Date.now() - ride.ArrivalTimeStamp) > getMilliSeconds(10)) {
                AcceptedRides.delete(requestId);
                ActiveMechanicRides.delete(mechanicId);
                if (!ride.listofMechanicsRejected.includes(mechanicId)) {
                    ride.listofMechanicsRejected.push(mechanicId);
                }
                console.log(ride.listofMechanicsRejected);
                return response.status(200).send({ "Status": 'CANCELLED', "Details": 'Can not find customer!' });
            }
            else{
                return response.status(400).send({ "error": "You Can't Cancel This Request." });
            }     
        }   
    }
    else
        return response.status(400).send({ "error": "You don't have any request." });
}

async function handleCustomerResponse(request, response) {

    const { error, value } = validateCustomerResponse(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const customerId = request.user._id;
    const customerResponse = request.body.customerResponse;
    // Check if this customer has an active request?
    if (!ActiveCustomerRides.has(customerId)) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }
    const requestId = ActiveCustomerRides.get(customerId);
    var ride = getRide(requestId);
    
    if (ride.Status != RIDE_STATUS_CWAITING) {
        return response.status(400).send({ "error": "You Didn't See Selected Services Or Items Yet!" });
    }
    ride.setStatus(RIDE_STATUS_WAITING);
    if (customerResponse == "Approve") {
        ride.customerApproval = true;
        return response.status(200).send({ "msg": "Approved!" });
    }
    else if (customerResponse == "Refuse") {
        //ride.setStatus(RIDE_STATUS_ARRIVED);
        return response.status(200).send({ "msg": "Refused!" });
    }
}

async function handleCancelRide(request, response) {
    // Get CustomerId from JWT Token
    const customerId = request.user._id;
    // Check if this customer has an active request?
    if (!ActiveCustomerRides.has(customerId)) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }
    const requestId = ActiveCustomerRides.get(customerId);
    var status = getRideStatus(requestId);
    if ((status == RIDE_STATUS_SEARCHING) || (status == RIDE_STATUS_ACCEPTED)) {
        ActiveCustomerRides.delete(customerId);
        if (status == RIDE_STATUS_ACCEPTED) {
            //var ride = null;
            ride = AcceptedRides.get(requestId);
            mechanicId = ride.mechanicId;
            let customer = await Customer.findOne({ _id: customerId });
            let mechanic = await Mechanic.findOne({ _id: mechanicId });
            //console.log(mechanicId);
            if ((Date.now() - ride.acceptedStamp) > getMilliSeconds(10)) {
                const customerFine = customer.wallet - 10;
                let customerResult = await Customer.findOneAndUpdate(
                    { _id: customerId },
                    { // updated data
                        wallet: customerFine
                    },
                    {
                        new: true
                    });
                const mechanicBonus = mechanic.balance + 10;
                let mechanicResult = await Mechanic.findOneAndUpdate(
                    { _id: mechanicId },
                    {
                        balance: mechanicBonus
                    },
                    {
                        new: true
                    });
                AcceptedRides.delete(requestId);
                ActiveMechanicRides.delete(mechanicId);
                return response.status(200).send({
                    "Status": 'CANCELLED',
                    "mechanicBalance": mechanicResult.balance,
                    "customerWallet": customerResult.wallet
                });
            }
            else {
                AcceptedRides.delete(requestId);
                ActiveMechanicRides.delete(mechanicId);
                return response.status(200).send({
                    "Status": 'CANCELLED',
                    "Details": 'No Fine Applied',
                    "mechanicBalance": mechanic.balance,
                    "customerWallet": customer.wallet
                });
            }
        }
        else {
            ReadyToAcceptRides.delete(requestId);
            return response.status(200).send({ "Status": 'CANCELLED' });
        }
    }
    else
        return response.status(400).send({ "error": "You Can't Cancel This Ride." });
}

async function handleCheckMechanicStatus(request, response) {

    // Get CustomerId from JWT Token
    const mechanicId = request.mechanic._id;
    // Check if this customer has an active request?
    if (!ActiveMechanicRides.has(mechanicId)) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get Request Id from ActiveCustomerRides
    // ActiveCustomersRides : Map<Key: CustomerId, Value: RequestId>
    const requestId = ActiveMechanicRides.get(mechanicId);
    var myRide = getRide(requestId);
    var status = myRide.Status;
    let customer = await Customer.findOne({ _id: myRide.requesterId });

    if (myRide == null)
        return response.status(400).send({ "error": "Unknown error occured. Ride is null." });


    if (status == RIDE_STATUS_ACCEPTED) {
        return response.status(200).send({
            "Status": status, "Time Passed Since Request Acceptance": ((Date.now() - myRide.acceptedStamp) / (1000 * 60)),
            "firstName": customer.firstName,
            "lastName": customer.lastName,
            "phoneNumber": customer.phoneNumber,
            "Customer_Location": myRide.pickupLocation
        });
    }
    else if (status == RIDE_STATUS_ARRIVED) {
        return response.status(200).send({
            "Status": status,
            "Time Passed Since Driver Arrival": ((Date.now() - myRide.ArrivalTimeStamp) / (1000 * 60)),
            "firstName": customer.firstName,
            "lastName": customer.lastName,
            "phoneNumber": customer.phoneNumber
        });
    }
    else if (status == RIDE_STATUS_CWAITING) {
        return response.status(200).send({
            "Status": status,
            "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60))

        });

    }
    else if (status == RIDE_STATUS_WAITING) {
        return response.status(200).send({
            "Status": status,
            "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60)),
            "customerResponse": myRide.customerApproval

        });

    }
    else if (status == RIDE_STATUS_STARTED) {
        return response.status(200).send({
            "Status": status,
            "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60)),
            "customerResponse": myRide.customerApproval

        });

    }
    else {// COMPLETED
        return response.status(200).send({
            "Status": status,
            "Fare": myRide.Fare
        });

    }
    
}


async function handleCheckRideStatus(request, response) {

    // Get CustomerId from JWT Token
    const customerId = request.user._id;
    // Check if this customer has an active request?
    if (!ActiveCustomerRides.has(customerId)) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get Request Id from ActiveCustomerRides
    // ActiveCustomersRides : Map<Key: CustomerId, Value: RequestId>
    const requestId = ActiveCustomerRides.get(customerId);
    var myRide = getRide(requestId);
    var status = myRide.Status;
    let mechanic = await Mechanic.findOne({ _id: myRide.mechanicId });
    // If ReadyToAcceptRides has this Request
    // Set Status = Searching
    // myRide = Request Object from ReadyToAcceptRides

    if (myRide == null)
        return response.status(400).send({ "error": "Unknown error occured. Ride is null." });

    // Increasing Scope thing
    if (status == RIDE_STATUS_SEARCHING) {
        // If 10 mins passed since the ride was created.... => Cancel Ride (Timeout)
        if ((Date.now() - myRide.creationTimeStamp) > getMilliSeconds(10)) {// terminate after 10 mins has passed of search.
            terminateRide(requestId, customerId);
            return response.status(200).send({ "Status": RIDE_STATUS_TERMINATED, "Reason": "10 mins timeout" });
        }
        // Each minute Scope is increased by 2KMs.
        if ((Date.now() - myRide.lastScopeIncrease) > getMilliSeconds(1)) {// Each minute increase the scope.
            myRide.lastScopeIncrease = Date.now();
            myRide.searchScope += 2000; //2000 meters
        }
        response.status(200).send({ "Status": status, "Scope": myRide.searchScope });
    }
    else {
        //let driver = await Driver.findOne({ _id: myRide.driverId });
        if (status == RIDE_STATUS_ACCEPTED) {
            return response.status(200).send({
                "Status": status, "Time Passed Since Request Acceptance": ((Date.now() - myRide.acceptedStamp) / (1000 * 60)),
                "firstName": mechanic.firstName,
                "lastName": mechanic.lastName,
                "phoneNumber": mechanic.phoneNumber,
                "MechanicLocation_lat": myRide.locationLat,
                "MechanicLocation_long": myRide.locationLong
            });
        }
        else if (status == RIDE_STATUS_ARRIVED) {
            return response.status(200).send({
                "Status": status,
                "Time Passed Since Driver Arrival": ((Date.now() - myRide.ArrivalTimeStamp) / (1000 * 60)),
                "firstName": mechanic.firstName,
                "lastName": mechanic.lastName,
                "phoneNumber": mechanic.phoneNumber,
                "MechanicLocation_lat": myRide.locationLat,
                "MechanicLocation_long": myRide.locationLong
            });
        }
        else if (status == RIDE_STATUS_CWAITING) {
            return response.status(200).send({
                "Status": status,
                "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60))
    
            });
    
        }
        else if (status == RIDE_STATUS_WAITING) {
            return response.status(200).send({
                "Status": status,
                "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60)),
                "customerResponse": myRide.customerApproval
    
            });
    
        }
        else if (status == RIDE_STATUS_STARTED) {
            return response.status(200).send({
                "Status": status,
                "Time Passed Since Service Start ": ((Date.now() - myRide.StartTimeStamp) / (1000 * 60)),
                "firstName": mechanic.firstName,
                "lastName": mechanic.lastName,
                "phoneNumber": mechanic.phoneNumber,
                "MechanicLocation_lat": myRide.locationLat,
                "MechanicLocation_long": myRide.locationLong

            });

        }
        else {// COMPLETED
            return response.status(200).send({
                "Status": status,
                "TripTime": myRide.getFinishETA(),
                "Fare": myRide.Fare
            });

        }
    }
}


function validaterepairsrequest(request) {
    const validationSchema = Joi.object({
        Repairsneeded: Joi.array().items(Joi.object(
            {
                id: Joi.string().required(),
                category: Joi.string().required(),
                number: Joi.string().required()
            }))

    })
    return validationSchema.validate(request.body);
}



async function GetFromMechRepairsToBeMade(request, response) {

    const { value, error } = validaterepairsrequest(request)
    if (error) return response.status(400).send({ "error": error.details[0].message });

    const mechanicId = request.mechanic._id;

    var RequestId = ActiveMechanicRides.get(mechanicId);
    if (RequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    Req = AcceptedRides.get(RequestId)
    if (Req.Status != RIDE_STATUS_ARRIVED) {
        return response.status(400).send({ "Error": "You Have Not Arrived Yet!" });
    }
    Req.setStatus(RIDE_STATUS_CWAITING);
    for (const repair of request.body.Repairsneeded) {
        if (repair.category == "item") {
            let Repair = await Item.findOne({ _id: repair.id })
            if (!Repair) {
                Req.RepairsMade = []
                response.status(400).send({ "error": "Item doesn't exist" });
            }
            else {
                RepairObject = {
                    Repairkind: repair.category,
                    Repairitself: Repair,
                    RepairNumber: repair.number
                }
                Req.RepairsMade.push(RepairObject)
            }
        }

        else if (repair.category == "service") {
            let Repair = await Services.findOne({ _id: repair.id })
            if (!Repair) {
                response.status(400).send({ "error": "service doesn't exist" });
            }
            else {
                RepairObject = {
                    Repairkind: repair.category,
                    Repairitself: Repair,
                    RepairNumber: repair.number
                }
                Req.RepairsMade.push(RepairObject)
            }
        }
    }
    console.log(Req.RepairsMade)
    response.status(200).send({ "Msg": "Done!" });

}

async function LoadRepairsToBeMadeToCustomer(request, response) {
    const customerId = request.user._id;

    // Get the Request Id from ActiveCustomerRides
    var RequestId = ActiveCustomerRides.get(customerId);
    if (RequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    Req = AcceptedRides.get(RequestId)
    if (!Req) {
        return response.status(400).send({ "error": "Your request hasn't got accepted yet!" });

    }

    return response.status(200).send({ "Repairs to be made": Req.RepairsMade });
}



module.exports = {
    getAllAvailableCars: getAllAvailableCars,
    handleCustomerNewRequest: handleCustomerNewRequest,
    handleCheckRideStatus: handleCheckRideStatus,
    handleCheckMechanicStatus: handleCheckMechanicStatus,
    handleMechanicRequest: handleMechanicRequest,
    handleMechanicResponse: handleMechanicResponse,
    handleMechanicCancellation: handleMechanicCancellation,
    handleUpdateMechanicLocation: handleUpdateMechanicLocation,
    handleCustomerResponse: handleCustomerResponse,
    handleCancelRide: handleCancelRide,
    handleEndRide: handleEndRide,
    handleWinch2CustomerRating: handleMechanic2CustomerRating,
    handleCustomer2WinchRating: handleCustomer2MechanicRating,
    dummyStart: dummyStart,
    GetFromMechRepairsToBeMade: GetFromMechRepairsToBeMade,
    LoadRepairsToBeMadeToCustomer: LoadRepairsToBeMadeToCustomer
};


