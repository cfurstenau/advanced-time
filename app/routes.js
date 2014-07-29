// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form

	//handler for the login form
	app.post('/login', passport.authenticate('ldap', {session:true}), function(req, res, next) {
		console.log(req.body);
		res.send({success: true, userId: req.user.employeeID});

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
	console.log(req);
	// if user is authenticated in the session, carry on
	if (req.user)
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
