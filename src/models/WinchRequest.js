class WinchRequest {
    searchScope = 5;// Intial value
    creationTimeStamp = Date.now();
    lastScopeIncrease = Date.now();
    constructor(requesterId, pickupLocation, dropOffLocation, driverId) {
        this.pickupLocation = pickupLocation;
        this.dropOffLocation = dropOffLocation;
        this.requesterId = requesterId;
        this.driverId = driverId;
    }


}
module.exports = {
    WinchRequest: WinchRequest
}