var express = require('express');
var bodyParser = require('body-parser');
var app = express();

//this makes things in the /public folder accessible
app.use(express.static(__dirname + '/public'));
//required to read POST body
app.use(bodyParser.urlencoded({extended:true}));

//handler for the login form
app.post('/login', function(req, res) {
    console.log(req.body);
    if (req.body.username == 'user' && req.body.password == 'password'){
      
      //TODO: do some research in handling a JSON response (making a single page app)
      res.send({success: true, message: ""});
    } else {
      res.send({
        success: false,
        errors: {
          username: "Wrong username",
          password: "Wrong password"
        }
      });
    }
});


var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});