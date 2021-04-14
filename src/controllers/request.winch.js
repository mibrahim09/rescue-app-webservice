const Joi = require('joi');
const { WinchRequest } = require('../models/WinchRequest');
const { Driver } = require('../models/winchDriver');
const { Customer } = require('../models/customer');

var mongoose = require('mongoose');
var ReadyToAcceptRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var AcceptedRides = new Map(); // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
var ActiveCustomerRides = new Map();// DICTIONARY --> KEY: OwnerId, VAL: RequestId

var ActiveDriverRides=new Map();// DICTIONARY --> KEY: DriverId, VAL: RequestId
var DistancesMap=new Map();

var nearestRequestId = "";

const RIDE_STATUS_SEARCHING = 'SEARCHING';
const RIDE_STATUS_ACCEPTED = 'ACCEPTED';
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
/*

*/
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
    if (ActiveCustomerRides.has(customerId)) {
        var currentRequestId = ActiveCustomerRides.get(customerId);
        return response.status(400).send({ "error": "This customer has already an active ride.", "status": getRideStatus(currentRequestId), "requestId": currentRequestId });
    }

    // Customer doesnt have any active rides.
    // Generate Unique Request Id
    const requestId = mongoose.Types.ObjectId();
    // Add it to the ActiveCustomerRides
    ActiveCustomerRides.set(customerId, requestId);

    // Generate New Request Object Constructor: CutomerId, Pickuplocation, DropOffLocation
    let newRequest = new WinchRequest(customerId, pickUpLocation, dropOffLocation, null);
    // Map <key: RequestId, Value: RequestObject>
    ReadyToAcceptRides.set(requestId, newRequest);

    // Response sent to the server (Status, RequestId)
    response.status(200).send({ "status": RIDE_STATUS_SEARCHING, "requestId": requestId });// So the app can send a request asking about it every 30 seconds.


    // var inputs = {
    //     origin: [currentLocation],
    //     destination: [pickUpLocation]
    // };

    // getDirections(inputs, function (result) {

    //     try {
    //         console.log(result.json.rows[0]);
    //         response.status(200).send({
    //             "distance": result.json.rows[0].elements[0].distance.text,
    //             "duration": result.json.rows[0].elements[0].duration.text
    //         });
    //     }
    //     catch (ex) { console.log(ex); }

    // });
}

function acceptRide(requestId, driverId) {
    var ride = null;
    ride = ReadyToAcceptRides.get(requestId);
    ride.driverId = driverId;
    customerId = ride.requesterId;
    ReadyToAcceptRides.delete(requestId);
    AcceptedRides.set(requestId, ride);         // DICTIONARY --> KEY: RequestId, VAL: WinchRequest
    ActiveDriverRides.set(driverId, requestId); // DICTIONARY --> KEY: DriverId, VAL: RequestId     
    return customerId;
}


function terminateRide(requestId, customerId) {
    var status = getRideStatus(requestId);
    if (status == RIDE_STATUS_SEARCHING) {
        ReadyToAcceptRides.delete(requestId);
        ActiveCustomerRides.delete(customerId);
    }
}

function getMilliSeconds(minutes) {
    return minutes * 60 * 1000;
}

async function handleDriverRequest(request,response) {

    const { error, value } = validateDriverRequest(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    const driverLocation = { lat: request.body.Location_Lat, lng: request.body.Location_Long };
    
    Driverid=request.driver._id
        
    if (ActiveDriverRides.has(Driverid)) {
        var currentRequestid = Driverrequests.get(Driverid);
        return response.status(400).send({ "error": "You already have a ride", "requestId": currentRequestid });
        }

    
    if (ReadyToAcceptRides.size==0){
        return response.status(400).send( { "error": "No client requests now"});

    }
    const promise=rideinturn=>new Promise((resolve)=>{

        getDirections(inputs, function (result) {
        
            try {
                //console.log(rideinturn);
                Distance=result.json.rows[0].elements[0].distance.text,
                Duration=result.json.rows[0].elements[0].duration.text
                //console.log(rideinturn[0])
                DistancesMap.set(rideinturn[0],Distance)
                resolve(Distance)
                //return response.status(400).send( "ok");

            }
            catch (ex) { console.log(ex); }
            
                    });});

    // const iterator1 = ReadyToAcceptRides.entries();
    // rideinturn=iterator1.next().value 
    RideInTurn=[]
    var inputs              
   
    for (let RideInTurn of ReadyToAcceptRides.entries()){
        inputs = {

            origin: [driverLocation],
            destination: [RideInTurn[1].pickupLocation]
                    };
        await promise(RideInTurn)
        
            }

    
    //console.log(Distances.values());
    NearestRide=DistancesMap.entries().next().value
    for (let dist of DistancesMap.entries()){
        if(dist[1]<NearestRide[1]){
            NearestRide=dist
        }

    }
    nearestRequestId = NearestRide[0];
    return response.status(200).send({"Nearest Ride: ":ReadyToAcceptRides.get(NearestRide[0])});
}

async function handleDriverResponse(request,response) {

    const { error, value } = validateDriverResponse(request);
    if (error) return response
        .status(400)
        .send({ "error": error.details[0].message });

    driverId = request.driver._id;
    const driverResponse = request.body.driverResponse ;
    const requestId = nearestRequestId ;
    if(requestId != "") {
        if (driverResponse == "Accept") { 
            const customerId = acceptRide(requestId, driverId);
            let customer = await Customer.findOne({ _id: customerId });
            return response.status(200).send({ "firstName": customer.firstName, "lastName": customer.lastName, "phoneNumber": customer.phoneNumber });
        } 
        else if (driverResponse == "Deny") {
            return response.status(400).send("Later");

        }
    }
    else 
        return response.status(400).send({"Error": "No Available Rides"});
      
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
    var myRide = null;
    var status = RIDE_STATUS_UNKNOWN;
    // If ReadyToAcceptRides has this Request
    // Set Status = Searching
    // myRide = Request Object from ReadyToAcceptRides
    if (ReadyToAcceptRides.has(requestId)) {
        myRide = ReadyToAcceptRides.get(requestId);
        status = RIDE_STATUS_SEARCHING;
    } 
    else if (AcceptedRides.has(requestId)) {
        myRide = AcceptedRides.get(requestId);
        status = RIDE_STATUS_ACCEPTED;
    }

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
    // console.log((Date.now() - myRide.creationTimeStamp) / 1000);


    // let newRequest = new WinchRequest(customerId, pickUpLocation, currentLocation);
    // ReadyToAcceptRides.set(requestId, newRequest);
    // response.status(200).send({ "status": "searching", "requestId": requestId });// So the app can send a request asking about it every 30 seconds.

    else if (status == RIDE_STATUS_ACCEPTED) {
        let driver = await Driver.findOne({ _id: myRide.driverId });
        return response.status(200).send({ "Status": status, "firstName": driver.firstName, "lastName": driver.lastName, "phoneNumber": driver.phoneNumber, "winchPlates": driver.winchPlates });
        
    }
}


module.exports = {
    handleCustomerNewRequest: handleCustomerNewRequest,
    handleCheckRideStatus: handleCheckRideStatus,
    handleDriverRequest: handleDriverRequest,
    handleDriverResponse: handleDriverResponse
};
