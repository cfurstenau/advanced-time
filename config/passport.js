// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var LDAPStrategy	= require('passport-ldapauth').Strategy;
var userLDAP = require('./../config/LDAP');





// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
    	console.log(user);
        done(null, user.dn);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        done(null, id);
    });

//LDAP =========================================================================
passport.use('ldap', new LDAPStrategy({
    server: {
      url: userLDAP.url,
      adminDn: userLDAP.adminDn,
      adminPassword: userLDAP.adminPassword,
      searchBase: userLDAP.searchBase,
	  searchFilter: userLDAP.searchFilter}
 	 }));


 // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with username and password from our form

		// find a user whose username is the same as the forms username
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.username' :  username }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false);

			// if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false);

            // all is well, return successful user
            return done(null, user);
        });

    }));

};
