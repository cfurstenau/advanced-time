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
				res.send({success: true, message: user.local.username + " logged in"});
			}
		})(req, res); //the (req, res) here passes them to passport
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
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
