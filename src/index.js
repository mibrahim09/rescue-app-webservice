let  debug = require('debug')('app:index');//
const express = require('express');
const morgan = require('morgan');
const config = require('config');
const bodyParser = require('body-parser');
const multer  = require('multer');
const configDB = require('./config');

if (!config.get('jwtPrivateKey')){
    console.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

// ENABLE THE DEBUGGER
process.env.DEBUG="*"
debug.enabled = true;
/*
const fileStorage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'images');
    },
    filename : (req,file,cb) => {
        cb(null,file.filename + '-' + file.originalname);
    }
});*/

const app = express();// Created a new web server

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(multer({storage: fileStorage}).single('image'));

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