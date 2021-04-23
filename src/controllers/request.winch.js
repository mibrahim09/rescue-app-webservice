const Joi = require('joi');
const { WinchRequest } = require('../models/WinchRequest');
const { Driver, insertDriverStars } = require('../models/winchDriver');
const { Customer, insertCustomerStars } = require('../models/customer');

var mongoose = require('mongoose');
const { inRange } = require('lodash');

var ReadyToAcceptRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var AcceptedRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var ActiveCustomerRides = new Map();// DICTIONARY --> KEY: OwnerId, VAL: RequestId

var ActiveDriverRides = new Map();// DICTIONARY --> KEY: DriverId, VAL: RequestId
var DistancesMap = new Map();

var nearestRequestId = "";

const RIDE_STATUS_SEARCHING = 'SEARCHING';
const RIDE_STATUS_ACCEPTED = 'ACCEPTED';
const RIDE_STATUS_STARTED = 'STARTED';
const RIDE_STATUS_COMPLETED = 'COMPLETED';
const RIDE_STATUS_UNKNOWN = 'UNKNOWN';
const RIDE_STATUS_TERMINATED = 'TERMINATED';




var googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyAK0cIYx9Ph4ld0CzcG4LRFAWcNeXFAXT8"
});

function validateNewRequest(request) {
    const validationSchema = Joi.object({
        DropOffLocation_Lat: Joi.string().required(),
        DropOffLocation_Long: Joi.string().required(),
        PickupLocation_Lat: Joi.string().required(),
        PickupLocation_Long: Joi.string().required()
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

function validateDriverRequest(request) {
    const validationSchema = Joi.object({
        Location_Lat: Joi.string().required(),
        Location_Long: Joi.string().required()
    });
    return validationSchema.validate(request.body);
}

function validateDriverResponse(request) {
    const validationSchema = Joi.object({
        driverResponse: Joi.string().required()
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


async function handleCustomer2WinchRating(request, response) {

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
            await insertDriverStars(ride.driverId, request.body.Stars, response);// Inserting the stars inside the customerDb.

            ActiveCustomerRides.delete(customerId);//Remove the customerId from ActiveCustomerRides

            if (!ride.WAITING_FOR_DRIVER_RATING && !ride.WAITING_FOR_CUSTOMER_RATING)
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


async function handleWinch2CustomerRating(request, response) {

    // Validate the input must have the finish location.
    const { error, value } = validateRating(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const driverId = request.driver._id;


    // Get the Request Id from ActiveDriverRides
    var currentRequestId = ActiveDriverRides.get(driverId);
    if (currentRequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get the Ride Object
    var ride = getRide(currentRequestId);
    if (ride.Status == RIDE_STATUS_COMPLETED) {

        if (ride.WAITING_FOR_DRIVER_RATING) {
            ride.WAITING_FOR_DRIVER_RATING = false;

            await insertCustomerStars(ride.requesterId, request.body.Stars, response);// Inserting the stars inside the customerDb.

            ActiveDriverRides.delete(driverId);//Remove the DriverId from ActiveDriverRides

            if (!ride.WAITING_FOR_DRIVER_RATING && !ride.WAITING_FOR_CUSTOMER_RATING)
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


async function handleEndRide(request, response) {

    // Validate the input must have the finish location.
    const { error, value } = validateEndRide(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });


    const driverId = request.driver._id;

    const finalLocation = { lat: request.body.finalLocation_Lat, lng: request.body.finalLocation_Long };

    // Get the Request Id from ActiveDriverRides
    var currentRequestId = ActiveDriverRides.get(driverId);
    if (currentRequestId == null) {
        return response.status(400).send({ "error": "You dont have any active rides." });
    }

    // Get the Ride Object
    var ride = getRide(currentRequestId);
    if (ride != null) {
        if (ride.Status == RIDE_STATUS_STARTED) {
            ride.setStatus(RIDE_STATUS_COMPLETED);// Change status to completed
            // Set the values for the finish
            ride.finalLocation = finalLocation;
            ride.FinishTimeStamp = Date.now();
            ride.WAITING_FOR_DRIVER_RATING = ride.WAITING_FOR_CUSTOMER_RATING = true;
            // Get the fare
            var fare = ride.CalcuateFare();

            // Save the Ride to Logs.
            ride.AddLogsToDb();

            return response.status(200).send(
                {
                    "STATUS": ride.Status,
                    "Fare": ride.Fare,
                    "TotalTimeForTrip": ride.getFinishETA()
                });
        }
        else return response.status(400).send({
            "error": "You can only end a started ride.",
            "status": ride.Status
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

    // Get the dropoff and pickup location (latitude, longitude)
    const dropOffLocation = { lat: request.body.DropOffLocation_Lat, lng: request.body.DropOffLocation_Long };
    const pickUpLocation = { lat: request.body.PickupLocation_Lat, lng: request.body.PickupLocation_Long };

    const customerId = request.user._id;
    // Check if this customer has an active request?
    // ActiveCustomerRides ==> Contains if the customer has an active ride. So he cant order 2 rides at the same time. 
    // Map<key: CustomerId, Value: RequestId>
    var currentRequestId = ActiveCustomerRides.get(customerId);
    if (currentRequestId != null) {
        //var currentRequestId = ActiveCustomerRides.get(customerId);
        var ride = getRide(currentRequestId);
        if (ride.Status == RIDE_STATUS_COMPLETED)
            return response.status(400).send({ "error": "You need to rate the previous ride before moving to another.", "status": ride.Status, "requestId": currentRequestId });
        else
            return response.status(400).send({ "error": "This customer has already an active ride.", "status": ride.Status, "requestId": currentRequestId });
    }

    // Customer doesnt have any active rides.
    // Generate Unique Request Id
    const requestId = mongoose.Types.ObjectId();
    // Add it to the ActiveCustomerRides
    ActiveCustomerRides.set(customerId, requestId);

    // Generate New Request Object Constructor: CutomerId, Pickuplocation, DropOffLocation
    let newRequest = new WinchRequest(customerId, pickUpLocation, dropOffLocation, null);
    newRequest.setStatus(RIDE_STATUS_SEARCHING);
    // Map <key: RequestId, Value: RequestObject>
    ReadyToAcceptRides.set(requestId, newRequest);

    // Response sent to the server (Status, RequestId)
    response.status(200).send({ "status": newRequest.Status, "requestId": requestId });// So the app can send a request asking about it every 30 seconds.
}

function acceptRide(requestId, driverId) {
    var ride = null;
    ride = ReadyToAcceptRides.get(requestId);
    ride.setStatus(RIDE_STATUS_ACCEPTED);
    ride.driverId = driverId;
    ride.acceptedStamp = Date.now();
    customerId = ride.requesterId;
    ReadyToAcceptRides.delete(requestId);
    AcceptedRides.set(requestId, ride);         // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
    ActiveDriverRides.set(driverId, requestId); // DICTIONARY --> KEY: DriverId, VAL: RequestId     
    return customerId;
}

async function dummyStart(request, response) {
    var ride = null;
    var requestId = ActiveDriverRides.get(request.driver._id);
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

async function handleDriverRequest(request, response) {

    const { error, value } = validateDriverRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const driverLocation = { lat: request.body.Location_Lat, lng: request.body.Location_Long };

    Driverid = request.driver._id

    var currentRequestId = ActiveDriverRides.get(Driverid);
    if (currentRequestId != null) {
        var ride = getRide(currentRequestId);
        if (ride.Status == RIDE_STATUS_COMPLETED)
            return response.status(400).send({ "error": "You need to rate the previous ride before moving to another.", "status": ride.Status, "requestId": currentRequestId });
        else
            return response.status(400).send({ "error": "You already have an active ride.", "status": ride.Status, "requestId": currentRequestId });
    }

    if (ReadyToAcceptRides.size == 0) {
        return response.status(400).send({ "error": "No client requests now" });
    }
    const promise = rideinturn => new Promise((resolve) => {

        getDirections(inputs, function (result) {

            try {
                Distance = result.json.rows[0].elements[0].distance.text,
                    Duration = result.json.rows[0].elements[0].duration.text
                DistancesMap.set(rideinturn[0], Distance)
                resolve(Distance)
            }
            catch (ex) { console.log(ex); }

        });
    });


    RideInTurn = []
    var inputs

    for (let RideInTurn of ReadyToAcceptRides.entries()) {
        inputs = {

            origin: [driverLocation],
            destination: [RideInTurn[1].pickupLocation]
        };
        await promise(RideInTurn)

    }


    //console.log(Distances.values());
    NearestRide = DistancesMap.entries().next().value
    for (let dist of DistancesMap.entries()) {
        if (dist[1] < NearestRide[1]) {
            NearestRide = dist
        }

    }
    nearestRequestId = NearestRide[0];
    return response.status(200).send({ "Nearest Ride: ": ReadyToAcceptRides.get(NearestRide[0]) });

    // FOR TESTING.
    // nearestRequestId = ReadyToAcceptRides.keys().next().value;
    // return response.status(200).send({ "Nearest Ride: ": ReadyToAcceptRides.get(nearestRequestId) });

}

async function handleUpdateDriverLocation (request, response) {

    const { error, value } = validateDriverRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const lat = request.body.Location_Lat;
    const long = request.body.Location_Long;

    let driverId = request.driver._id;

    var currentRequestId = ActiveDriverRides.get(driverId);

    if (currentRequestId != null) {
        currentRequestId.locationLat = lat;
        currentRequestId.locationLong = long;
        return response.status(200).send({"Done": "Your Location has been Updated Successfully"});  
    }
    else
        return response.status(400).send({ "error": "You don't have an active ride."});

}


async function handleDriverResponse(request, response) {

    const { error, value } = validateDriverResponse(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    driverId = request.driver._id;
    const driverResponse = request.body.driverResponse;
    const requestId = nearestRequestId;
    if (requestId != "") {
        if (driverResponse == "Accept") {
            const customerId = acceptRide(requestId, driverId);
            let customer = await Customer.findOne({ _id: customerId });
            return response.status(200).send({ "firstName": customer.firstName, "lastName": customer.lastName, "phoneNumber": customer.phoneNumber });
        }
        else if (driverResponse == "Deny") {
            return response.status(200).send("Later");

        }
    }
    else
        return response.status(400).send({ "Error": "No Available Rides" });

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
    if ((status == RIDE_STATUS_SEARCHING) || (status == RIDE_STATUS_ACCEPTED)){
        ActiveCustomerRides.delete(customerId);
        if (status == RIDE_STATUS_ACCEPTED){
            //var ride = null;
            ride = AcceptedRides.get(requestId);
            driverId = ride.driverId;
            let customer = await Customer.findOne({ _id: customerId });
            let driver = await Driver.findOne({ _id: driverId });
            console.log(driverId);
            if ((Date.now() - ride.acceptedStamp) > getMilliSeconds(2)) {
                const customerFine = customer.wallet - 10;
                let customerResult = await Customer.findOneAndUpdate(
                    { _id: customerId },
                    { // updated data
                        wallet : customerFine
                    },
                    {
                        new: true
                    });
                const driverBonus = driver.balance + 10;
                let driverResult = await Driver.findOneAndUpdate(
                    { _id: driverId },
                    {
                        balance: driverBonus
                    },
                    {
                        new: true
                    });
                AcceptedRides.delete(requestId); 
                ActiveDriverRides.delete(driverId);
                return response.status(200).send({ 
                    "Status": 'CANCELLED', 
                    "driverBalance": driverResult.balance,
                    "customerWallet": customerResult.wallet
                });
            }
            else {
                AcceptedRides.delete(requestId); 
                ActiveDriverRides.delete(driverId);
                return response.status(200).send({ 
                    "Status": 'CANCELLED', 
                    "Details": 'No Fine Applied',
                    "driverBalance": driver.balance,
                    "customerWallet": customer.wallet
                });
            }
        }
        else 
        {
            ReadyToAcceptRides.delete(requestId);
            return response.status(200).send({"Status": 'CANCELLED'});
        }  
    }
    else
        return response.status(400).send({ "error": "You Can't Cancel This Ride." });      
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
            myRide.searchScope += 2;
        }
        response.status(200).send({ "Status": status, "Scope": myRide.searchScope });
    }
    else {
        let driver = await Driver.findOne({ _id: myRide.driverId });
        if (status == RIDE_STATUS_ACCEPTED || status == RIDE_STATUS_STARTED) {
            return response.status(200).send({ "Status": status, "Time Passed": ((Date.now()-myRide.acceptedStamp)/(1000*60)), "firstName": driver.firstName, "lastName": driver.lastName, "phoneNumber": driver.phoneNumber, "winchPlates": driver.winchPlates });
        }
        else {// COMPLETED
            return response.status(200).send({
                "Status": status,
                "winchPlates": driver.winchPlates,
                "TripTime": myRide.getFinishETA()
            });

        }
    }
}


module.exports = {
    handleCustomerNewRequest: handleCustomerNewRequest,
    handleCheckRideStatus: handleCheckRideStatus,
    handleDriverRequest: handleDriverRequest,
    handleDriverResponse: handleDriverResponse,
    handleUpdateDriverLocation: handleUpdateDriverLocation,
    handleCancelRide: handleCancelRide,
    handleEndRide: handleEndRide,
    handleWinch2CustomerRating: handleWinch2CustomerRating,
    handleCustomer2WinchRating: handleCustomer2WinchRating,
    dummyStart: dummyStart
};
