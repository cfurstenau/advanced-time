
// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var bodyParser = require('body-parser');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var MongoStore = require('connect-mongo')(session);
var configDB = require('./config/database.js');
var ldap = require('passport-ldapauth');
var connect = require('connect');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(connect);

// required for passport
app.use(session({cookie : { maxAge: 3600000} , store : new MongoStore(
            {
            	db: "test",
                host: "localhost",
                port: 27017,
                mongoose_connection: mongoose.connections[0]
            },
            function(error) {
                if(error) {
                    return console.error('Failed connecting mongostore for storing session data. %s', error);
                }
                return console.log('Connected mongostore for storing session data');
            }
         ), secret: 'ja8j42haf67ajw9dajkwa8a82hj4f6a2h4h2k8' })); // session secret
        
        
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

//this makes things in the /public folder accessible
app.use(express.static(__dirname + '/public'));

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport



var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});