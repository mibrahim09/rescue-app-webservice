class MechanicRequest {
    searchScope = 5000;// Intial value 5000 meters
    creationTimeStamp = Date.now();
    lastScopeIncrease = Date.now();
    acceptedStamp = null;
    FinishTimeStamp = Date.now();
    Fare = 0.0;
    visit_fare = 0.0;   // Base Fare = 7.50   
    Expected_duration = null;   // May be needed
    WAITING_FOR_MECHANIC_RATING = false;
    WAITING_FOR_CUSTOMER_RATING = false;
    Status = "";
    RequestId = "";
    customerApproval = false;

    mechanicId = null;

    initial_LocationLat = null;
    initial_LocationLong = null;

    locationLat = null;
    locationLong = null;

    ArrivalTimeStamp = null;
    StartTimeStamp = Date.now();

    RepairsMade = [];
    customerIntialDiagnosis = [];

    listofMechanicsRejected = []; // mechanicId: RequestId

    constructor(requesterId, pickupLocation, estimated_time, estimated_fare, customerCar) {
        this.pickupLocation = pickupLocation;
        this.requesterId = requesterId;
        this.estimated_time = estimated_time;
        this.estimated_fare = estimated_fare;
        this.customerCarBrand = customerCar.CarBrand;
        this.customerCarModel = customerCar.Model;
        this.customerCarPlates = customerCar.Plates;
        this.customerCarYear = customerCar.Year;

    }

    setStatus(status) {
        this.Status = status;
    }

    set_visit_fare(visitFare) {
        this.visit_fare = visitFare;
    }

    setMechanicInitialLocation(initial_LocationLat, initial_LocationLong) {
        this.initial_LocationLat = initial_LocationLat;
        this.initial_LocationLong = initial_LocationLong;
        this.locationLat = initial_LocationLat;
        this.locationLong = initial_LocationLong;
    }

    updateMechanicLocation(location_Lat, location_Long) {
        this.locationLat = location_Lat;
        this.locationLong = location_Long;
    }

    CalcuateFare() {
        if (this.customerApproval == true) {
            if (this.RepairsMade.length != 0) {
                for (var i = 0; i < this.RepairsMade.length; i++) {
                    if (this.RepairsMade[i].Repairkind == "item") {
                        this.Fare += this.RepairsMade[i].Repairitself.Price * parseInt(this.RepairsMade[i].RepairNumber);
                    }
                    if (this.RepairsMade[i].Repairkind == "service") {
                        this.Fare += this.RepairsMade[i].Repairitself.ExpectedFare;
                    }

                }
            }
        }
        this.Fare += this.visit_fare * 2;
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
    MechanicRequest: MechanicRequest
}