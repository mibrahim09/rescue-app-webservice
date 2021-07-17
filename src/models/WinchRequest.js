class WinchRequest {
    searchScope = 5000;// Intial value 5000 meters
    creationTimeStamp = Date.now();
    lastScopeIncrease = Date.now();
    acceptedStamp = null;
    FinishTimeStamp = Date.now();
    Fare = 0.0;
    initialFare = 0.0;
    Expected_duration = null;   // May be needed
    WAITING_FOR_DRIVER_RATING = false;
    WAITING_FOR_CUSTOMER_RATING = false;
    Status = "";
    RequestId = "";

    driverId = null;

    initial_LocationLat = null;
    initial_LocationLong = null;
    locationLat = null;
    locationLong = null;

    ArrivalTimeStamp = null;
    StartTimeStamp = Date.now();

    listofdriversRejected = [];

    constructor(requesterId, pickupLocation, dropOffLocation, estimated_time, estimated_distance, estimated_fare, customerCar) {
        this.pickupLocation = pickupLocation;
        this.dropOffLocation = dropOffLocation;
        this.requesterId = requesterId;
        //this.RequestId = RequestId;
        this.estimated_time = estimated_time;
        this.estimated_distance = estimated_distance;
        this.estimated_fare = estimated_fare;
        this.customerCarBrand = customerCar.CarBrand;
        this.customerCarModel = customerCar.Model;
        this.customerCarPlates = customerCar.Plates;
        this.customerCarYear = customerCar.Year;
    }


    setStatus(status) {
        this.Status = status;
    }

    set_Initial_fare(initialFare) {
        this.initialFare = initialFare;
    }

    setDriverInitialLocation(initial_LocationLat, initial_LocationLong) {
        this.initial_LocationLat = initial_LocationLat;
        this.initial_LocationLong = initial_LocationLong;
        this.locationLat = initial_LocationLat;
        this.locationLong = initial_LocationLong;
    }

    updateDriverLocation(location_Lat, location_Long) {
        this.locationLat = location_Lat;
        this.locationLong = location_Long;
    }

    CalcuateFare() {
        // TODO: Calculate the distance between the 2 points and the timestamp.
        var res = Math.abs(this.FinishTimeStamp - this.StartTimeStamp) / 1000;
        var minutes = Math.floor(res / 60) % 60;
        this.initialFare += minutes * 0.20;
        this.Fare += this.initialFare * 16;
        return this.Fare;
    }

    getFinishETA() {
        var res = Math.abs(this.FinishTimeStamp - this.StartTimeStamp) / 1000;
        // get total days between two dates
        var days = Math.floor(res / 86400);
        // get hours        
        var hours = Math.floor(res / 3600) % 24;
        // get minutes
        var minutes = Math.floor(res / 60) % 60;
        // get seconds
        var seconds = res % 60;
        return {
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds
        };
    }
}
module.exports = {
    WinchRequest: WinchRequest
}