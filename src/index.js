// My includes
const express = require('express');
const bodyParser = require('body-parser')
const app = express();// Created a new web server

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


// Load all the routes
app.use('/', require('./routes'));

// listen on the port 
const port = process.env.PORT || 3000;// GETS the port from the Environmet variables.
app.listen(port, () => {
    console.log(`listening on port => ${port}`);
});