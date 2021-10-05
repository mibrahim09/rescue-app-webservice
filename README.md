# rescue-app-webservice

* Registering Customer | [TYPE: POST] 
- No authentication Required 
- link : http://161.97.155.244/api/registeration/customer

Sample JSON request  (ALL FIELDS REQUIRED)
{
    "phoneNumber" : "01003661677",
    "fireBaseId" : "ExampleTokenHere"
}


Expected response

-> If an invalid phone number verification
{
    "error": "Invalid mobile verification."
}


-> If a valid phone number verification and the user is NEW.
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDBjNDQwNDZlOWMyNTAxMjgwNzlmZDEiLCJmaXJzdE5hbWUiOiJTYXJhIiwibGFzdE5hbWUiOiJBeW1hbiIsImlhdCI6MTYxMTQxNzc3OX0.-MIpaNfM6BZaPjLRKU7iFuSbwFTTdC9vuQ-D-iKyOK4"
}



-> If a valid phone number verification and the user EXISTS (HAS A FIRST AND LAST NAME).
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDJkNDcwYzEzNTdjYTRjZGNjYjlhYzIiLCJ2ZXJpZmllZCI6dHJ1ZSwidXNlcl90eXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE2MTM1ODE1NTJ9.NaGBzKBy_tA9r18z9YWaa57xYphlhW86GQm4FLkjcpc",
    "firstName": "Mohammed",
    "lastName": "Ibrahim"
}


Decoded JWT response (the PAYLOAD of JWT will be as follows)
{
  "_id": "602d470c1357ca4cdccb9ac2",
  "verified": true,
  "user_type": "customer",
  "iat": 1613581101
}

[You dont have to worry about any of these parameters.]

"verified" --> If he has a first and last name. (Used in the authorization). 
    - True: For existing users.
    - False: For new users.
    

  
"user_type" --> To identify the user.

And then you can use the access token in the next POST request to set the first and last name.
================================================================================================ 
================================================================================================

* Updating Customer data (IS THIS YOU?) | [TYPE: POST] 
- Authorization Required
- format of the link: http://161.97.155.244/api/customer/me/updateprofile

How to do Authorization? 

Send in the Header with the 

Key: x-auth-token
Value: Token

Sample JSON request (ALL FIELDS REQUIRED)
{
    "firstName": "Muhammad",
    "lastName": "Hussien"
}


EXPECTED RESPONSE IF VALID 
Status (200)

A new token will be generated for you and sent back. YOU NEED TO REPLACE THE OLD TOKEN WITH THIS BECAUSE THE APP WILL NOT PROCEED IF YOU DONT HAVE A FIRSTNAME AND LASTNAME SET IN THE TOKEN.

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDBjNDQwNDZlOWMyNTAxMjgwNzlmZDEiLCJmaXJzdE5hbWUiOiJTYXJhIiwibGFzdE5hbWUiOiJBeW1hbiIsImlhdCI6MTYxMTQxODYwOX0.0PQ1bIgKeLDENrqRd30kdJbRTxuGvbKfO8spzUbNZgY"
}


On Invalid Id except an error like this 
Status (400)
{
    "error": "User doesnt exist."
}

================================================================================================
