// app/routes.js
var dynamics = require('./models/dynamics.js');
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form

	//handler for the login form
	app.post('/login', function(req, res, next) {
		console.log(req.body);
		passport.authenticate('local-login', function(err, user){
			if (!user) {
				res.send({success: false});
			} else {
				res.send({success: true, user: user.local.username});
				dynamics.testQuery();
			}

			// make passportjs setup the user object, serialize the user, ...
            req.login(user, {}, function(err) {
                if (err) { return next(err) };
            });


		})(req, res, next); //the (req, res) here passes them to passport
		return;
	});

	//handler for timecard
	app.post('/timecard',isLoggedIn, function(req, res) {
		console.log(req.body);
	});





	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

};





// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.user)
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
