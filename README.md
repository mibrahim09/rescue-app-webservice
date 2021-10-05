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
