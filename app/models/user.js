// app/models/user.js
// load the things we need
var ldap = require('ldapjs');
var bcrypt   = require('bcrypt-nodejs');
var userLDAP = require('./../../config/LDAP');

ldap.Attribute.settings.guid_format = ldap.GUID_FORMAT_B;

var client = ldap.createClient({
	url: userLDAP.url
});

var opts = {
  	filter: '(objectclass=user)',
 	 scope: 'sub',
 	 attributes: ['objectGUID']
};


client.bind('CN=images,OU=Restricted GPOS,DC=ptg-domain,DC=com', '4L9ad1ng#PC!', function (err) {
	console.log(err);
});



// methods ======================
// generating a hash
client.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
client.validPassword = function(password) {
    return (password == this.local.password);
};

// create the model for users and expose it to our app
module.exports = client;
