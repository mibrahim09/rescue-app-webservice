let  debug = require('debug')('app:index');//
const express = require('express');
const morgan = require('morgan');
const configDB = require('./config');

// ENABLE THE DEBUGGER
process.env.DEBUG="*"
debug.enabled = true;

// const bodyParser = require('body-parser')
const app = express();// Created a new web server

app.use(express.urlencoded({ extended: true }));// parse application/x-www-form-urlencoded
app.use(express.json());// parse application/json

console.log(debug.enabled);//


if (app.get('env') === 'development') {
    app.use(morgan('tiny')); // Used for logging the requests. Will use this probably only on the development not production.
    debug('We are on DEVELOPMENT MODE.');
    debug('Morgan is enabled.');//
}
configDB.startConnection();



// Load all the routes
app.use('/', require('./routes'));

// listen on the port 
const port = process.env.PORT || 3000;// GETS the port from the Environmet variables.
app.listen(port, () => {
    debug(`listening on port => ${port}`);
});