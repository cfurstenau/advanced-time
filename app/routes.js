// app/routes.js
var dynamics = require('./models/dynamics.js');
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================

	app.post('/login', passport.authenticate('ldap', {session:true}), function(req, res, next) {
		var now = new Date(2013, 1, 1); //test date
		var dates = dynamics.payperiodButton(now); 
		console.log(dates);
		res.send({success: true, userId: req.user.employeeID, payperiods: dates});
		
	});

	// =====================================
	// TIMECARD ============================
	// =====================================

	app.post('/timecard',isLoggedIn, function(req, res) {
		res.send({success:true});
		dynamics.getTimecard(req.user,req.date);
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
