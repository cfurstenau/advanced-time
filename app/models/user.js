// app/models/user.js
// load the things we need
var ldap = require('ldapjs');
var bcrypt   = require('bcrypt-nodejs');
var userLDAP = require('./../../config/LDAP');

ldap.Attribute.settings.guid_format = ldap.GUID_FORMAT_B;

// connect to WWTAS LDAP server
var client = ldap.createClient({
	url: userLDAP.url
});

client.bind(userLDAP.adminDn, userLDAP.adminPassword, function (err) {
	
});

// methods ======================
// generating a hash
client.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// create the model for users and expose it to our app
module.exports = client;
