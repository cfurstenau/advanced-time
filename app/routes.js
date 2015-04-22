// app/routes.js
var dynamics = require('./models/dynamics.js');
module.exports = function(app, passport) {

	// =====================================
	// LOGIN ===============================
	// =====================================

	app.post('/login', passport.authenticate('ldap', {session:true}), function(req, res, next) {
		var now = new Date(); //test date
		var start = new Date(now.setDate(now.getDate() - 28));
		var employee = req.user.employeeID;
		var agent = req.headers['user-agent'];
		console.log(employee + " logged in using " + agent + " at " + now);
		//send date, employee and res object to dynamics
		dynamics.getUserData(start, employee, res);
	});

	// =====================================
	// TIMECARD ============================
	// =====================================

	app.post('/timecard',isLoggedIn, function(req, res) {
		dynamics.getTimecard(req.body.employee,req.body.date, res);
	});

	// =====================================
	// SAVE ============================
	// =====================================

	app.post('/save',isLoggedIn, function(req, res) {
		if (req.body.docnbr) {
			dynamics.updateTimecard(req.body.employee, req.body.timecard,
				req.body.docnbr, req.body.defaultSubacct, res);
		} else {
			dynamics.createTimecard();
		}

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
