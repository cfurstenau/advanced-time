// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================
	app.post('/login', passport.authenticate('ldap', {session:true}), function(req, res, next) {
		res.send({success: true, userId: req.user.employeeID});

	});

	// =====================================
	// TIMECARD ============================
	// =====================================
	app.post('/timecard',isLoggedIn, function(req, res) {
		res.send({success:true});
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
