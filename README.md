# Rescue app service

# Customers Application

* Registering Customer | [TYPE: POST] 
- **No authentication Required **
- link : http://161.97.155.244/api/registeration/customer

Sample JSON request  (ALL FIELDS REQUIRED)
```json
{
    "phoneNumber" : "01003661677",
    "fireBaseId" : "ExampleTokenHere"
}
```

Expected response

-> If an invalid phone number verification
```json
{
    "error": "Invalid mobile verification."
}
```

-> If a valid phone number verification and the user is **NEW**.
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDBjNDQwNDZlOWMyNTAxMjgwNzlmZDEiLCJmaXJzdE5hbWUiOiJTYXJhIiwibGFzdE5hbWUiOiJBeW1hbiIsImlhdCI6MTYxMTQxNzc3OX0.-MIpaNfM6BZaPjLRKU7iFuSbwFTTdC9vuQ-D-iKyOK4"
}
```


-> If a valid phone number verification and the user **EXISTS** (HAS A FIRST AND LAST NAME).
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDJkNDcwYzEzNTdjYTRjZGNjYjlhYzIiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE2MTM1ODE1NTJ9.NaGBzKBy_tA9r18z9YWaa57xYphlhW86GQm4FLkjcpc",
    "firstName": "Mohammed",
    "lastName": "Ibrahim"
}
```

Decoded JWT response (the PAYLOAD of JWT will be as follows)
```json
{
  "_id": "602d470c1357ca4cdccb9ac2",
  "verified": true,
  "user_type": "customer",
  "iat": 1613581101
}
```
```
[You dont have to worry about any of these parameters.]

"verified" --> If he has a first and last name. (Used in the authorization). 
    - True: For existing users.
    - False: For new users.
    

  
"user_type" --> To identify the user.
```

And then you can use the access token in the next POST request to set the first and last name.
================================================================================================

================================================================================================

* Updating Customer data (IS THIS YOU?) | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/customer/me/updateprofile

How to do Authorization? 

Send in the Header with the 

**Key**: x-auth-token
**Value**: Token

Sample JSON request (ALL FIELDS REQUIRED)
```json
{
    "firstName": "Muhammad",
    "lastName": "Hussien"
}
```

EXPECTED RESPONSE IF VALID 
Status (200)

A new token will be generated for you and sent back. *YOU NEED TO REPLACE THE OLD TOKEN WITH THIS BECAUSE THE APP WILL NOT PROCEED IF YOU DONT HAVE A FIRSTNAME AND LASTNAME SET IN THE TOKEN.*

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDBjNDQwNDZlOWMyNTAxMjgwNzlmZDEiLCJmaXJzdE5hbWUiOiJTYXJhIiwibGFzdE5hbWUiOiJBeW1hbiIsImlhdCI6MTYxMTQxODYwOX0.0PQ1bIgKeLDENrqRd30kdJbRTxuGvbKfO8spzUbNZgY"
}
```

On Invalid Id except an error like this 
Status (400)
```json
{
    "error": "User doesnt exist."
}
```

# Authorization Responses

**Access denied. No token provided.** --> No access token provided in the header
**Invalid token** --> Bad JWT token (Possibly a bad JWT private key).
**Unverified User** --> Trying to make requests using an unverified user. (No first or last name)
**Unknown usertype** --> Trying to make requests using the wrong user_type.
**User doesn't exist.** --> Deleted user or possibly a non-exisiting objectid.

================================================================================================
* Inserting a new car for a user | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/customer/me/car
- Plates is a **unique** value.
```json
{
    "CarBrand": "Seat",
    "Model": "Leon",
    "Year": "2014",
    "Plates": "فخم2222"
}
```

On a valid response STATUS (200) --> It'll return the car ObjectId and plates.
```json
{
    "_id": "6021da4274c931104c6dbb78",
    "Plates": "فخم2222"
}
```

If the plates already exists it'll send an error like this
```json
{
    "error": "E11000 duplicate key error collection: winchdb.customer_cars index: Plates_1 dup key: { Plates: \"عق201\" }"
}
```
================================================================================================

================================================================================================
* Loading all cars for a user (FIRST TIME) | [TYPE: GET] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/customer/me/car

Nothing is required in the body.

Expected response

```json
[
    {
        "_id": "6021d85c6235d226f4498089",
        "CarBrand": "Kia",
        "Model": "Cerato",
        "Year": 2010,
        "OwnerId": "600f12d9151add1764173a3e",
        "Plates": "سصه2185",
        "__v": 0
    },
    {
        "_id": "6021d92948be7210143921b3",
        "CarBrand": "Kia",
        "Model": "Koup",
        "Year": 2013,
        "OwnerId": "600f12d9151add1764173a3e",
        "Plates": "سص7185",
        "__v": 0
    },
    {
        "_id": "6021d93f48be7210143921b4",
        "CarBrand": "Seat",
        "Model": "Leon",
        "Year": 2014,
        "OwnerId": "600f12d9151add1764173a3e",
        "Plates": "فخم2222",
        "__v": 0
    },
    {
        "_id": "6021d9e4114d9326ac50c205",
        "CarBrand": "Seat",
        "Model": "Ibiza",
        "Year": 2018,
        "OwnerId": "600f12d9151add1764173a3e",
        "Plates": "نجم6666",
        "__v": 0
    },
    {
        "_id": "6021da4274c931104c6dbb78",
        "CarBrand": "Seat",
        "Model": "Ibiza",
        "Year": 2019,
        "OwnerId": "600f12d9151add1764173a3e",
        "Plates": "عق201",
        "__v": 0
    }
]
```
================================================================================================

================================================================================================
* Loading cars for the app itself (FIRST TIME) | [TYPE: GET] 
- **NO Authorization Required**
- format of the link: http://161.97.155.244/api/info/allcars

Expected response

```json
[
    {
        "_id": "60229d8599349f157000f5b0",
        "CarBrand": "Seat",
        "Model": "Ibiza",
        "StartYear": 1994,
        "EndYear": 2021,
        "__v": 0
    },
    {
        "_id": "60229e3e99349f157000f5b1",
        "CarBrand": "Seat",
        "Model": "Leon",
        "StartYear": 1994,
        "EndYear": 2021,
        "__v": 0
    },
    {
        "_id": "60229e4c99349f157000f5b2",
        "CarBrand": "Fiat",
        "Model": "Tipo",
        "StartYear": 2018,
        "EndYear": 2021,
        "__v": 0
    }
]
```

================================================================================================

================================================================================================

**JUST FOR TESTING**
* Add new cars for the app itself | [TYPE: POST] 
- **NO Authorization Required FOR NOW BUT IN THE FUTURE WILL REQUIRE ADMIN AUTHORIZATION**
- format of the link: http://161.97.155.244/api/info/allcars

Body should be like this

```json
{
    "CarBrand": "Kia",
    "Model": "Koup",
    "StartYear": "2010",
    "EndYear": "2013"
}
```

Expected Response:

```json
{
    "_id": "60229ef199349f157000f5b3",
    "CarBrand": "Kia",
    "Model": "Koup",
    "StartYear": 2010,
    "EndYear": 2013,
    "__v": 0
}
```
================================================================================================

================================================================================================
* Creating a new winch request (NOT COMPLETED YET) | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/requestwinch/createrequest

Data required
```json
{
    "DropOffLocation_Lat": "20.21207",
    "DropOffLocation_Long": "29.90909",
    "PickupLocation_Lat": "31.236110220827165",
    "PickupLocation_Long": "29.948748010875686",
    "Estimated_Time":"5",
    "Estimated_Distance":"150",
    "Estimated_Fare":"150",
    "Car_ID":"6088512e5208e3189800a2ba"
}
```

On a valid response STATUS (200) --> It'll return the following.
```json
{
    "status": "SEARCHING",
    "requestId": "602d812619dd6414140f4032"
}
```

If you try to request a ride again on the same user with an active ride. 
```json
{
    "error": "This customer has already an active ride.",
    "status": "SEARCHING",
    "requestId": "602d812619dd6414140f4032"
}
```

If you try to request a ride without rating the previous ride it'll return the following

```json
{
    "error": "You need to rate the previous ride before moving to another.",
    "status": "COMPLETED",
    "requestId": "6080956b626fc8563c6df11a"
}```


================================================================================================

================================================================================================
* Checking the winch request status (NOT COMPLETED YET) | [TYPE: GET] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/requestwinch/checkstatus

--> If you have no active rides
```json
{
    "error": "You dont have any active rides."
}
```

If you have active rides. (Every 1 min the Scope is increased by 2 KMs).
```json
{
    "Status": "SEARCHING",
    "Scope": 5
}
```


After 10 mins the request search times-out and sends this response.
```json
{
    "Status": "TERMINATED",
    "Reason": "10 mins timeout"
}
```

================================================================================================

================================================================================================
* Rating the Winch driver | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/requestwinch/Rate

Data required
```json
{
    "Stars": "3"
}
```

On a valid response STATUS (200) --> It'll return the following.
```json
{
    "msg": "Rated Successfully"
}
```

================================================================================================

================================================================================================
* Cancel Request | [TYPE: GET] 
- Authorization Required
- format of the link: http://161.97.155.244/api/requestwinch/cancelride

 If the request is still searching 
```
{
    "Status": "CANCELLED"
}
```

 Cancel a request which is already accepted
```
{
    "Status": "CANCELLED",
    "Details": "No Fine Applied",
    "driverBalance": 0,
    "customerWallet": 0
}```

Cancel a request which has been accepted from 10 min.
```
{
    "Status": "CANCELLED",
    "driverBalance": 10,
    "customerWallet": -10
}```
 
============================================================================= 
 Check Status (All Cases since acceptance till the end):
  Request Type: GET
  Authorization Required
 format of the link :http://161.97.155.244/api/requestwinch/checkstatus

 If the ride is accepted:
```
{
    "Status": "ACCEPTED",
    "Time Passed Since Request Acceptance": 0.2539166666666667,
    "firstName": "mohamed",
    "lastName": "ibrahim",
    "phoneNumber": "+201004125602",
    "winchPlates": "134سعى",
    "DriverLocation_lat": "31.21207",
    "DriverLocation_long": "29.90909"
}
```

If driver has arrived:
```
{
    "Status": "ARRIVED",
    "Time Passed Since Driver Arrival": 0.12553333333333333,
    "firstName": "mohamed",
    "lastName": "ibrahim",
    "phoneNumber": "+201004125602",
    "winchPlates": "134سعى",
    "DriverLocation_lat": "31.21207",
    "DriverLocation_long": "29.90909"
}
```

If the service has started:
```
{
    "Status": "Service STARTED",
    "Time Passed Since Service Start ": 0.07655,
    "firstName": "mohamed",
    "lastName": "ibrahim",
    "phoneNumber": "+201004125602",
    "winchPlates": "134سعى",
    "DriverLocation_lat": "31.21207",
    "DriverLocation_long": "29.90909"
}
```
 

If Ride Is Completed
```
{
    "Status": "COMPLETED",
    "winchPlates": "110سعص",
    "TripTime": {
        "days": 0,
        "hours": 0,
        "minutes": 0,
        "seconds": 38.522
    },
    "Fare": 16.32
}
```

================================================================================================
* Creating a new mechanic request | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/requestmechanic/createrequest

Data required
```json
{
    "PickupLocation_Lat": "31.236110220827165",
    "PickupLocation_Long": "29.948748010875686",
    "IntialDiagnosis": "Car battery fault",
    "Car_ID":"608983215c65c00c48af7403"
}
```

On a valid response STATUS (200) --> It'll return the following.
```json
{
    "status": "SEARCHING",
    "requestId": "602d812619dd6414140f4032"
}
```

If you try to request a ride again on the same user with an active ride. 
```json
{
    "error": "This customer has already an active ride.",
    "status": "SEARCHING",
    "requestId": "602d812619dd6414140f4032"
}
```

If you try to request a ride without rating the previous ride it'll return the following

```json
{
    "error": "You need to rate the previous ride before moving to another.",
    "status": "COMPLETED",
    "requestId": "6080956b626fc8563c6df11a"
}```

If the car id doesnt belong to a car in the database
```json
{
  "error": "No such car found."
}
```

If the car id isnt owned by the customer sending the request
```json
{
  "error": "This car isnt owned by this user."
}
```


================================================================================================

================================================================================================
* Rating the Mechanic  | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/requestmechanic/Rate

Data required
```json
{
    "Stars": "3"
}
```

On a valid response STATUS (200) --> It'll return the following.
```json
{
    "msg": "Rated Successfully"
}
```

================================================================================================

================================================================================================
* Cancel Request | [TYPE: GET] 
- Authorization Required
- format of the link: http://161.97.155.244/api/requestmechanic/cancelride

- If the request is still in searching state
```
{
    "Status": "CANCELLED"
}
```

- Cancel a request which is already accepted
```
{
    "Status": "CANCELLED",
    "Details": "No Fine Applied",
    "mechanicBalance": 0,
    "customerWallet": 0
}
```

- Cancel a request which has been accepted from 10 min.
```
{
    "Status": "CANCELLED",
    "mechanicBalance": 10,
    "customerWallet": -10
}
```

-Customer displays Repairs chosen by mechanic [Type:Get]
-Authorization required
-format of the link: http://161.97.155.244/api/requestmechanic/loadRepairsToBeMade
-Expected response:
```
{
    "Repairs to be made": [
        {
            "Repairkind": "item",
            "Repairitself": {
                "_id": "60a524f2184a165a3420278b",
                "Category": "سينسور",
                "ItemDesc": "سينسور اكسوجين Nissan Sunny",
                "Price": 1200,
                "__v": 0
            },
            "RepairNumber": "2"
        },
        {
            "Repairkind": "service",
            "Repairitself": {
                "_id": "60a533f6be2f873684fe04e6",
                "Category": "تغير سينسور",
                "ServiceDesc": "تغير سينسور الاكسوجين",
                "ExpectedFare": 250,
                "__v": 0
            },
            "RepairNumber": "1"
        }
    ]
}
```
================================================================================================
* Handling customer response | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/requestmechanic/CustomerResponse

Customer can Approve OR Refuse

1)
```
{
    "customerResponse": "Approve"
}
```
Response : 
```
{
    "msg": "Approved!"
}
```
2)
```
{
    "customerResponse": "Refuse"
}
```

Response : 
```
{
    "msg": "Refused!"
}
```

* Checking the Mechanic request status | [TYPE: GET] 
- Authorization Required
- format of the link: http://161.97.155.244/api/requestmechanic/checkstatus

--> If you have no active rides
```
{
    "error": "You dont have any active rides."
}
```

If you have active rides. (Every 1 min the Scope is increased by 2 KMs).
```
{
    "Status": "SEARCHING",
    "Scope": 5
}
```

After 10 mins the request search times-out and sends this response.
```
{
    "Status": "TERMINATED",
    "Reason": "10 mins timeout"
}
```

--> If the request is accepted
```
{
    "Status": "ACCEPTED",
    "Time Passed Since Request Acceptance": 0.039716666666666664,
    "firstName": "Mohamed",
    "lastName": "Aly",
    "phoneNumber": "+201223456789",
    "MechanicLocation_lat": "31.211179915799473",
    "MechanicLocation_long": "29.919808104281334"
}
```

--> If Mechanic has arrived
```
{
    "Status": "ARRIVED",
    "Time Passed Since Driver Arrival": 0.0533,
    "firstName": "Mohamed",
    "lastName": "Aly",
    "phoneNumber": "+201223456789",
    "MechanicLocation_lat": "31.211179915799473",
    "MechanicLocation_long": "29.919808104281334"
}
```

--> Waiting for customer approval
```
{
    "Status": "WAITING_FOR_APPROVAL",
    "Time Passed Since Service Start ": 0.8258
}
```
--> Customer Response
```
{
    "Status": "CUSTOMER_RESPONSE",
    "Time Passed Since Service Start ": 3.1228166666666666,
    "customerResponse": true
}```

--> If the service has started [ Only if customer approved it ]
```
{
    "Status": "Service STARTED",
    "Time Passed Since Service Start ": 0.09743333333333333,
    "firstName": "Mohamed",
    "lastName": "Aly",
    "phoneNumber": "+201223456789",
    "MechanicLocation_lat": "31.211179915799473",
    "MechanicLocation_long": "29.919808104281334"
}```

--> If Mechanic finished his service
```
{
    "Status": "COMPLETED",
    "TripTime": {
        "days": 0,
        "hours": 0,
        "minutes": 0,
        "seconds": 25.014
    },
    "Fare": 1470.01
}
```

================================================================================================
Modifications **
* Creating a new mechanic request | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/requestmechanic/createrequest

Data required
```
{
    "PickupLocation_Lat": "31.236110220827165",
    "PickupLocation_Long": "29.948748010875686",
   "IntialDiagnosis":[
        {"id":"60edaf26b466820094c06b90",
        "category":"problem"
        },
        {"id":"60edaf46b466820094c06b91",
        "category":"problem"
        },
        {"id":"60a576834fd661310c118030",
        "category":"service"
        }
        ],
    "Estimated_Time":"5",
    "Estimated_Fare":"150",
    "Car_ID":"608a6e994d67bb12486aaa4e"
}
```

# Winch API

================================================================================================
* Registering Winch Driver | [TYPE: POST] 
- No authentication Required 
- format of the link: http://161.97.155.244/api/registeration/winchUser 
Sample JSON request  (ALL FIELDS REQUIRED)
```
{
    "phoneNumber" : "+201234567895",
    "fireBaseId" : "ExampleTokenHere"
}
```

Verification Same as Customer
Expected response

-> If a valid phone number verification 
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDg0NzA1ZjhiZWY4YjE4NThiZWMwNmQiLCJ2ZXJpZmllZCI6ZmFsc2UsInVzZXJfdHlwZSI6IndpbmNoRHJpdmVyIiwiaWF0IjoxNjE5MjkyNTk4fQ.3OB-t53K3j6e0KkdcYP3f8pgl3mgyJpXYijEo9dEYfc"
}
```

- Payload Data JWT
```
{
  "_id": "6084705f8bef8b1858bec06d",
  "verified": false,
  "user_type": "winchDriver",
  "iat": 1619292598
}
```

- If user is already exist & verified :
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDE2MDhjODljNGYwNTQ1NTA4MDkzZTMiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoid2luY2hEcml2ZXIiLCJpYXQiOjE2MTkyOTIyODR9.ZiCdTbBLDn7zXHkNuRGF9E9o4717gMf1D4YDZqXczac",
    "firstName": "Sara",
    "lastName": "Ayman",
    "winchPlates": "123سعص",
    "governorate": "Alexandria"
}
```

- Payload Data JWT
```
{
  "_id": "601608c89c4f0545508093e3",
  "verified": true,
  "user_type": "winchDriver",
  "iat": 1619292284
}
```
 
And then you can use the access token in the next POST request to set the first & last name, winchPlates and governorate
================================================================================================
================================================================================================

* Updating Driver's data (IS THIS YOU?) | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/winchDriver/me/updateprofile

How to do Authorization? 

Send in the Header :

Key: x-auth-token
Value: Given Token In The Prev. Step

Key: language 
Value: ar or en  [Here is an example when value : en]

Sample JSON request (ALL FIELDS REQUIRED)
```
{
    "firstName": "Sara",
    "lastName": "Ayman",
    "winchPlates": "123سعص",
    "governorate": "Alexandria"
}
```

Accepts Arabic or English
Expected response

If data is valid :
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDg0NzA1ZjhiZWY4YjE4NThiZWMwNmQiLCJ2ZXJpZmllZCI6ZmFsc2UsInVzZXJfdHlwZSI6IndpbmNoRHJpdmVyIiwiaWF0IjoxNjE5MjkzMDEyfQ.NtN9W70N-fCixGx_HVgkeSHItsPm4pB-4DPv4V1AxoQ"
}
```

Token Example After Setting up the firstName & lastName & winchPlates & governorate
Decoded JWT response (the PAYLOAD of JWT will be as follows)  STILL NOT VERIFIED

```
{
  "_id": "6084705f8bef8b1858bec06d",
  "verified": false,
  "user_type": "winchDriver",
  "iat": 1619293012
}
```
 
And then you can use the access token in the next POST request to upload the images
================================================================================================
================================================================================================

* Updating Driver's data (IS THIS YOU?) | [TYPE: POST] 
- Authorization Required
- format of the link: http://domain.com/api/winchDriver/me/UploadImages

How to do Authorization? 

Send in the Header with the 

```
Key: x-auth-token
Value: Given Token In The Prev. Step
```

Expected response
If data is valid:

```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDE2MDhjODljNGYwNTQ1NTA4MDkzZTMiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoid2luY2hEcml2ZXIiLCJpYXQiOjE2MTkyOTIyODR9.ZiCdTbBLDn7zXHkNuRGF9E9o4717gMf1D4YDZqXczac"
}
```

If file extension is not valid :
```
{
    "error": "File Format Is Incorrect !"
}
```

Final Token After Setting Up All The Data
Decoded JWT response (the PAYLOAD of JWT will be as follows)
[ FinalAuthToken After Uploading Images ] VERIFIED DATA
```
{
  "_id": "601608c89c4f0545508093e3",
  "verified": true,
  "user_type": "winchDriver",
  "iat": 1619292284
}
```

-Winch driver request to get nearest client (Type:Post)
-Authorization is required 
-Format of link : http://161.97.155.244/api/driverMatching/getNearestClient                                                                  
```
{
"Location_Lat": "31.231449938355556",
"Location_Long": "29.942782777717145"
}
```
 
Expected response :    

```
{
    "Nearest Ride: Pickup Location": {
        "lat": "31.236110220827165",
        "lng": "29.948748010875686"
    },
    "Dropoff Location": {
        "lat": "20.21207",
        "lng": "29.90909"
    }
}
```

Response in case of no client requests:   

```
{
    "error": "No client requests now"
}
```

Response in case the driver has already accepted a ride and still have it:                                                                             
```
{
    "error": "You already have a ride",
    "requestId": "607ee23a73c4b9353c0fc17f"
}
```

* Driver Response | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/driverMatching/driverResponse
{
    "driverResponse": "Accept"
}

- Response : Get Customer's Information

```
{
    "firstName": "haidy",
    "lastName": "osama",
    "phoneNumber": "+201011175270",
    "EstimatedTime": "5",
    "EstimatedDistance": "150",
    "EstimatedFare": "150",
    "CarBrand": "Seat",
    "CarModel": "Leon",
    "CarPlates": "فخم2222"
}
 
```
* Ending a Ride | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/driverMatching/EndRide

Data required

```json
{
    "finalLocation_Lat": "31.541",
    "finalLocation_Long": "24.157"
}
```

On a valid response STATUS (200) --> It'll return the following.

```json
{
    "STATUS": "COMPLETED",
    "Fare": 200,
    "TotalTimeForTrip": {
        "days": 0,
        "hours": 0,
        "minutes": 0,
        "seconds": 1.717
    }
}
```

* Rating the Customer | [TYPE: POST] 
- **Authorization Required**
- format of the link: http://161.97.155.244/api/driverMatching/Rate

Data required
```json
{
    "Stars": "3"
}
```

On a valid response STATUS (200) --> It'll return the following.
```json
{
    "msg": "Rated Successfully"
}
```
* Driver Live Tracker | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/driverMatching/liveTracker

Data required
```
{
    "Location_Lat": "31.21207",
    "Location_Long": "29.90909"
}
```

Response 

```
{
    "Done": "Your Location has been Updated Successfully"
}```

  Driver Arrival [Type:Post]
  Authorization Required
  format of the link: http://161.97.155.244/api/driverMatching/driverArrival
*Data required 
{
    "driverResponse": "Arrived"
}
Response : 
{
    "msg": "Alright!"
}
Response In case of the driver hasn't accepted the ride before:                                                                                                    
{ "Error": "You Have No Ride!" }
 
Service start [Type:Post]
Authorization Required
format of the link: http://161.97.155.244/api/driverMatching/ServiceStart

*Data required 

```
{
    "driverResponse": "Service Start"
}```

Response : 
```
{
    "msg": "Alright!"
}
```
Response In case of the driver hasn't accepted the ride before:                                                                                                    

```
{ "Error": "You Have No Ride!" }
```

Response In case of the driver hasn't arrived yet:

```
{ "Error": "You Have Not Arrived Yet!" }
```

* Driver Cancellation  | [TYPE: GET] 
- Authorization Required
- format of the link: http://161.97.155.244/api/driverMatching/DriverCancel

If Driver Is Searching For A Request 
Response 
```
{
    "Status": "CANCELLED"
}
```

If Driver Has Already Accepted The Request 
Response 
```
{
    "Status": "CANCELLED",
    "Details": "Request was accepted"
}
```

If Driver Has Already Arrived ( from less than 10 mins )
Response
```
{
    "error": "You Can't Cancel This Request."
}
```


If Driver Has Already Arrived ( 10 mins ago )
Response

```
{
    "Status": "CANCELLED",
    "Details": "Can not find customer!"
}
```

# Mechanic API

* Mechanic Registering | [TYPE: POST] 
- No authentication Required 
- link :  http://161.97.155.244/api/registeration/mechanicUser
Sample JSON request  (ALL FIELDS REQUIRED)

```
{
    "phoneNumber" : "+201223456787",
    "fireBaseId" : "ExampleTokenHere"
}
```
 
Expected response

-> If a valid phone number verification But User Already Exists
msg :

```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhMDIyZWRlZjc1NDNmODg0MTk3NzIiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoibWVjaGFuaWMiLCJpYXQiOjE2MTk2NTc0NjV9.x4EC7LAmyDOsqReCZ4e-5fu09VFD5o3pZWM1nvEdpp4",
    "firstName": "Mohamed",
    "lastName": "Aly",
    "governorate": "Cairo"
}
```

- Payload JWT
```
{
  "_id": "608a022edef7543f88419772",
  "verified": true,
  "user_type": "mechanic",
  "iat": 1619657465
}```


-> If a valid phone number verification & New User
msg:
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhMDNhMGRlZjc1NDNmODg0MTk3NzMiLCJ2ZXJpZmllZCI6ZmFsc2UsInVzZXJfdHlwZSI6Im1lY2hhbmljIiwiaWF0IjoxNjE5NjU3NjMyfQ.WInt29fWMOx_1G6Z6OH-FhSPKlO92E61dXu7lTa1uxU"
}
```

- Payload JWT
```
{
  "_id": "608a03a0def7543f88419773",
  "verified": false,
  "user_type": "mechanic",
  "iat": 1619657632
}
```
 
Sara — 02/09/2021
And then you can use the access token in the next POST request to set the first & last name,  and governorate
================================================================================================
================================================================================================

* Updating Mechanic's data (IS THIS YOU?) | [TYPE: POST] 
- Authorization Required
- format of the link:  http://161.97.155.244/api/mechanic/me/updateprofile

How to do Authorization? 

Send in the Header :

Key: x-auth-token
Value: Given Token In The Prev. Step

Key: language 
Value: ar or en  [Here is an example when value : ar]

Sample JSON request (ALL FIELDS REQUIRED)
```
{
    "firstName": "سارة",
    "lastName": "ايمن",
    "governorate": "الإسكندرية"
    
}
```

Accepts Arabic or English

Expected response

If data is valid :
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhMDIyZWRlZjc1NDNmODg0MTk3NzIiLCJ2ZXJpZmllZCI6ZmFsc2UsInVzZXJfdHlwZSI6Im1lY2hhbmljIiwiaWF0IjoxNjE5NjU3NDQ3fQ.6HDlMptAD3OrLhSd_YyaiEzzLBMGzCqcwhpCjSPiHUI"
}
```

Token Example After Setting firstName & lastName & governorate
Decoded JWT response (the PAYLOAD of JWT will be as follows) 

```
{
  "_id": "608a022edef7543f88419772",
  "verified": false,
  "user_type": "mechanic",
  "iat": 1619657447
}
```
 
And then you can use the access token in the next POST request to upload the images
================================================================================================
================================================================================================

* Updating Mechanic's data (IS THIS YOU?) | [TYPE: POST] 
- Authorization Required
- format of the link:  http://161.97.155.244/api/mechanic/me/UploadImage

How to do Authorization? 

Send in the Header with the 

Key: x-auth-token
Value: Given Token In The Prev. Step 
Image
Expected response
If data is valid :

```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhMDIyZWRlZjc1NDNmODg0MTk3NzIiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoibWVjaGFuaWMiLCJpYXQiOjE2MTk2NTc0NTB9.H0bqe2s9J6ml_fkuxLaVKqeFOAEsXVvZdryGDkq_UXg"
}
```

If file extension is not valid :
```
{
    "error": "File Format Is Incorrect !"
}
```

Final Token 
Decoded JWT response (the PAYLOAD of JWT will be as follows)
[ FinalAuthToken After Uploading Mechanic's personalPicture ]

```
{
  "_id": "608a022edef7543f88419772",
  "verified": true,
  "user_type": "mechanic",
  "iat": 1619657450
}
```
 
And then you can use the access token in the next POST request to set the first & last name,  and governorate


* Updating Mechanic's data (IS THIS YOU?) (NOT COMPLETED YET) | [TYPE: POST] 
- Authorization Required
- format of the link:  http://161.97.155.244/api/mechanic/me/employment

Send in the Header :

Key: x-auth-token
Value: Given Token In The Prev. Step

Sample JSON request

```
{
    "employee": "false"
}
```

Response
```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhNjBjMzQxZDY3ODA1YWM5Y2Y5NGQiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoibWVjaGFuaWMiLCJpYXQiOjE2MTk2ODE2MzJ9.qsT-yCdkXfRQn57w_TKh3zKU2ykNVA3mkIAyeqttzHA"
}
```

Sample JSON request ( CENTERID REQUIRED ONLY IF EMPLOYEE IS TRUE)

```
{
    "employee": "true"
}
```

Response

```
{
    "error": "\"centerId\" is required"
}
```

If center doesn't exist 

```
{
    "employee": "true",
    "centerId": "608a60c341d67805ac9cf94d"
}
```

Response

```
{
    "error": "Center doesn't exist."
}
```

Else If Center exists

```
{
    "employee": "true",
    "centerId": "608a5e74a15c8c36786d2acc"
}
```

Response

```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDhhNjBjMzQxZDY3ODA1YWM5Y2Y5NGQiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoibWVjaGFuaWMiLCJpYXQiOjE2MTk2ODIwNjJ9.FUfm7EXge14edROw16Wd49P1YtDVhj7v7ydKf3Fzi90"
}
```
