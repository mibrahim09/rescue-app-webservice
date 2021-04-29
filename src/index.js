let debug = require('debug')('app:index');//
const express = require('express');
const morgan = require('morgan');
const config = require('config');
const bodyParser = require('body-parser');
const multer = require('multer');
const configDB = require('./config');
const firebase = require('./controllers/firebase');
const winstonLogger = require('winston');
require('winston-mongodb');

const app = express();// Created a new web server

if (!config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

// ENABLE THE DEBUGGER
debug.enabled = true;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));// parse application/x-www-form-urlencoded
app.use(express.json());// parse application/json

console.log(debug.enabled);//


if (app.get('env') === 'development') {
    app.use(morgan('tiny')); // Used for logging the requests. Will use this probably only on the development not production.
    debug('We are on DEVELOPMENT MODE.');
    debug('Morgan is enabled.');//
}

configDB.startConnection();

firebase.Init();


// Load all the routes
app.use('/', require('./routes'));

// listen on the port 
const port = process.env.PORT || 3000;// GETS the port from the Environmet variables.
app.listen(port, () => {
    debug(`listening on port => ${port}`);
});