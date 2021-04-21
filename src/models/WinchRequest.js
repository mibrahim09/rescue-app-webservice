class WinchRequest {
    searchScope = 5;// Intial value
    creationTimeStamp = Date.now();
    lastScopeIncrease = Date.now();
    FinishTimeStamp = Date.now();
    StartedTimeStamp = Date.now();
    Fare = 0.0;
    WAITING_FOR_DRIVER_RATING = false;
    WAITING_FOR_CUSTOMER_RATING = false;
    Status = "";
    constructor(requesterId, pickupLocation, dropOffLocation, driverId) {
        this.pickupLocation = pickupLocation;
        this.dropOffLocation = dropOffLocation;
        this.requesterId = requesterId;
        this.driverId = driverId;
    }


    setStatus(status) {
        this.Status = status;
    }

    CalcuateFare() {
        // TODO: Calculate the distance between the 2 points and the timestamp.
        this.Fare = 200;// Dummy value for now.
        return this.Fare;
    }

    AddLogsToDb() {
        // Do the logs here in the DB.
    }

    getFinishETA() {
        var res = Math.abs(this.FinishTimeStamp - this.StartedTimeStamp) / 1000;
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