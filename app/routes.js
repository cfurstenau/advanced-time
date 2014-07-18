// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	
	//handler for the login form
	app.post('/login', function(req, res) {
		console.log(req.body);
		passport.authenticate('local-login', function(err, user){
			if (!user) {
				res.send({success: false});
			} else {
				res.send({success: true, user: user.local.username});
			}
		})(req, res); //the (req, res) here passes them to passport
	});
	
	//handler for timecard
	app.post('/timecard', passport.authenticate('local-login'), function(req, res) {
		    // If this function gets called, authentication was successful.
    		// `req.user` contains the authenticated user.
    		console.log("Success");

	});
	




	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res, next) {
		req.logout();
		res.redirect('/');
	});

};





// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
	// you can do this however you want with whatever variables you set up
	if (req.isAuthenticated())
		return next();

	// IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
	res.redirect('/');
}
