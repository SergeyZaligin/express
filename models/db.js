const express = require('express');
const app = express();
var mongoose = require('mongoose');
var gracefulShutdown;
//var dbURI = 'mongodb://test:test359@ds149711.mlab.com:49711/suslik';
const credentials = require('../credentials');

switch (app.get('env')) {
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString);
        mongoose.connection.on('connected', function() {
            console.log('Mongoose connected to development ' + credentials.mongo.development.connectionString);
        });
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString);
        mongoose.connection.on('connected', function() {
            console.log('Mongoose connected to production ' + credentials.mongo.production.connectionString);
        });
        break;
    default:
        throw new Error('Неизвестная среда выполнения: ' + app.get('env'));
}

//mongoose.connect(dbURI);

// CONNECTION EVENTS


mongoose.connection.on('error', function(err) {
    console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function() {
    console.log('Mongoose disconnected');
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
gracefulShutdown = function(msg, callback) {
    mongoose.connection.close(function() {
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

// For nodemon restarts
process.once('SIGUSR2', function() {
    gracefulShutdown('nodemon restart', function() {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// For app termination
process.on('SIGINT', function() {
    gracefulShutdown('app termination', function() {
        process.exit(0);
    });
});

// For Heroku app termination
process.on('SIGTERM', function() {
    gracefulShutdown('Heroku app termination', function() {
        process.exit(0);
    });
});

// BRING IN YOUR SCHEMAS & MODELS
//require('./category');
