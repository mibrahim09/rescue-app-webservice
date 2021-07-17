const mongoose = require('mongoose');
const debug = require('debug')('app:config');

debug.enabled = true;

const connectionString = 'mongodb://localhost:27017/winchdb';

function startConnection() {
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true }).
        then(() => { debug('Connected to MongoDB.'); }).
        catch(error => debug(error));

}

module.exports = {
    startConnection: startConnection
}
